import type * as TrueFoundryGatewayApi from "../api/index.js";
import type { SessionsClient } from "../api/resources/private/resources/agents/resources/sessions/client/Client.js";
import type { TrueFoundryGateway } from "../CustomClient.js";
import type * as core from "../core/index.js";
import type { BaseAgentSession } from "./AgentSession.js";
import { parseSequenceNumber, type TurnStreamData } from "./TurnStreamData.js";

// Per-request overrides (abortSignal / timeoutInSeconds / maxRetries / headers) forwarded to every autogen call.
// SessionsClient is NOT re-exported under TrueFoundryGateway.agents, so import it directly (as AgentSessionClient does).
type RequestOptions = SessionsClient.RequestOptions;

// waitForCompletion poll interval: default and enforced minimum.
const DEFAULT_POLL_INTERVAL_MS = 3000;
const MIN_POLL_INTERVAL_MS = 3000;

// Output of listTurns / getTurn (and what PreparedTurn mints once started): a started turn that
// owns all data AND behavior. Identity fields are immutable readonly; the volatile field
// (state) is getter-backed and updated in place by refresh()/waitForCompletion().
export class Turn implements TrueFoundryGatewayApi.Turn {
    /** Unique identifier of this turn. */
    readonly id: string;
    /** Identifier of the parent session. */
    readonly sessionId: string;
    /** Previous turn id in the chain, if any. */
    readonly previousTurnId?: string;
    /** Input items sent when the turn was created. */
    readonly input?: TrueFoundryGatewayApi.TurnInputItem[];
    /** Subject that started this turn. */
    readonly createdBySubject: TrueFoundryGatewayApi.Subject;
    /** ISO-8601 timestamp when the turn was created. */
    readonly createdAt: string;
    /** Parent session this turn belongs to. */
    readonly session: BaseAgentSession;
    readonly #client: TrueFoundryGateway;
    #state: TrueFoundryGatewayApi.TurnState;

    constructor(turn: TrueFoundryGatewayApi.Turn, session: BaseAgentSession, client: TrueFoundryGateway) {
        this.id = turn.id;
        this.sessionId = turn.sessionId;
        this.previousTurnId = turn.previousTurnId;
        this.input = turn.input;
        this.createdBySubject = turn.createdBySubject;
        this.createdAt = turn.createdAt;
        this.#state = turn.state;
        this.session = session;
        this.#client = client;
    }

    /**
     * @returns {TrueFoundryGatewayApi.TurnState} Updated by `refresh()`, `stream()`, and `waitForCompletion()`.
     */
    get state(): TrueFoundryGatewayApi.TurnState {
        return this.#state;
    }

    // Terminal states are listed explicitly (not `status !== "running"`) so a newly added
    // non-terminal status keeps polling by default; new terminal states must be added here.
    private isTerminal(state: TrueFoundryGatewayApi.TurnState): boolean {
        switch (state.status) {
            case "done":
            case "cancelled":
            case "error":
                return true;
            default:
                return false;
        }
    }

    // Refetch from the server, update #state in place, and return self.
    /**
     * Refetch from the server, update state in-place and return self.
     *
     * @param requestOptions - Overrides client timeout, retries, abortSignal, headers, queryParams.
     * @returns {this} This turn with updated state.
     */
    async refresh(requestOptions?: RequestOptions): Promise<this> {
        const response = await this.#client.agents.sessions.getTurn(this.sessionId, this.id, requestOptions);
        this.#state = response.data.state;
        return this;
    }

    /**
     * Poll getTurn until terminal.
     *
     * @param opts.pollIntervalMs - Poll interval ms while waiting. Minimum 3000.
     * @param requestOptions - Overrides client timeout, retries, abortSignal, headers, queryParams.
     * @returns {TrueFoundryGatewayApi.TurnState} Terminal turn state.
     */
    async waitForCompletion(
        opts?: { pollIntervalMs?: number },
        requestOptions?: RequestOptions,
    ): Promise<TrueFoundryGatewayApi.TurnState> {
        const pollIntervalMs = opts?.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
        if (pollIntervalMs < MIN_POLL_INTERVAL_MS) {
            throw new Error(`pollIntervalMs must be at least ${MIN_POLL_INTERVAL_MS}ms`);
        }
        while (!this.isTerminal(this.#state)) {
            await new Promise((r) => setTimeout(r, pollIntervalMs));
            await this.refresh(requestOptions);
        }
        return this.#state;
    }

    // Reconnect to the turn's SSE; let the server decide what to stream (no client-side guard).
    // Updates #state in place from any event that carries a state snapshot.
    /**
     * Reconnect to the turn's SSE. Updates state in-place from lifecycle events.
     *
     * @param opts.afterSequenceNumber - Sequence number to resume SSE subscription after.
     * @param requestOptions - Overrides client timeout, retries, abortSignal, headers, queryParams.
     * @yields {TurnStreamData} SSE stream items.
     */
    async *stream(
        opts?: { afterSequenceNumber?: number },
        requestOptions?: RequestOptions,
    ): AsyncIterable<TurnStreamData> {
        const sse = await this.#client.agents.sessions.subscribeToTurn(
            this.sessionId,
            this.id,
            { afterSequenceNumber: opts?.afterSequenceNumber },
            requestOptions,
        );
        for await (const { data: event, id } of sse.withMetadata()) {
            this.#applyEvent(event);
            yield { sequenceNumber: parseSequenceNumber(id), event };
        }
    }

    // Keep #state in sync from streamed events that carry a state snapshot
    // (turn.created -> running, turn.done -> done/cancelled/error). Used only by this Turn's own
    // stream() above; hard-private so it never appears on instances handed to SDK users.
    #applyEvent(event: TrueFoundryGatewayApi.TurnStreamingEvent): void {
        if (event.type === "turn.created" || event.type === "turn.done") this.#state = event.state;
    }

    /**
     * Cancel the running last turn for the session.
     *
     * @param requestOptions - Overrides client timeout, retries, abortSignal, headers, queryParams.
     * @returns {void}
     */
    async cancel(requestOptions?: RequestOptions): Promise<void> {
        await this.#client.agents.sessions.cancel(this.sessionId, {}, requestOptions);
    }

    // Expose the autogen Fern Page as-is (it is already async-iterable); no re-wrapping.
    /**
     * Paginated turn events; use `stream()` for live SSE.
     *
     * @param opts.pageToken - Token from the previous response nextPageToken.
     * @param opts.limit - Page size. Default 25.
     * @param opts.order - Sort by creation time. Default `asc`.
     * @param requestOptions - Overrides client timeout, retries, abortSignal, headers, queryParams.
     * @returns {Promise<core.Page<TrueFoundryGatewayApi.TurnEvent, TrueFoundryGatewayApi.ListEventsResponse>>} Paginated turn events.
     */
    listEvents(
        opts?: TrueFoundryGatewayApi.agents.SessionsListTurnEventsRequest,
        requestOptions?: RequestOptions,
    ): Promise<core.Page<TrueFoundryGatewayApi.TurnEvent, TrueFoundryGatewayApi.ListEventsResponse>> {
        return this.#client.agents.sessions.listTurnEvents(this.sessionId, this.id, opts, requestOptions);
    }
}
