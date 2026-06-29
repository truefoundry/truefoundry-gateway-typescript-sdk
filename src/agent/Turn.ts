import type * as TrueFoundryGateway from "../api/index.js";
import type { SessionsClient } from "../api/resources/agents/resources/sessions/client/Client.js";
import type { TrueFoundryGatewayClient } from "../Client.js";
import type * as core from "../core/index.js";
import type { AgentSession } from "./AgentSession.js";
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
export class Turn implements TrueFoundryGateway.Turn {
    readonly id: string;
    readonly sessionId: string;
    readonly previousTurnId?: string;
    readonly input?: TrueFoundryGateway.TurnInputItem[];
    readonly createdBySubject: TrueFoundryGateway.Subject;
    readonly createdAt: string;
    readonly session: AgentSession;
    readonly #client: TrueFoundryGatewayClient;
    #state: TrueFoundryGateway.TurnState;

    constructor(turn: TrueFoundryGateway.Turn, session: AgentSession, client: TrueFoundryGatewayClient) {
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

    get state(): TrueFoundryGateway.TurnState {
        return this.#state;
    }

    private isTerminal(state: TrueFoundryGateway.TurnState): boolean {
        return state.status !== "running";
    }

    // Refetch from the server, update #state in place, and return self.
    async refresh(requestOptions?: RequestOptions): Promise<this> {
        const response = await this.#client.agents.sessions.getTurn(this.sessionId, this.id, requestOptions);
        this.#state = response.data.state;
        return this;
    }

    async waitForCompletion(
        opts?: { pollIntervalMs?: number },
        requestOptions?: RequestOptions,
    ): Promise<TrueFoundryGateway.TurnState> {
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
            this.applyEvent(event);
            yield { sequenceNumber: parseSequenceNumber(id), event };
        }
    }

    // Keep #state in sync from streamed events that carry a state snapshot
    // (turn.created -> running, turn.done -> done/cancelled/error). Intentionally NOT `private`:
    // it is an internal cross-class hook also called by PreparedTurn.consumeStream(). Not part of
    // the public TrueFoundryGateway.Turn interface (@internal).
    /** @internal */
    applyEvent(event: TrueFoundryGateway.TurnStreamingEvent): void {
        if (event.type === "turn.created" || event.type === "turn.done") this.#state = event.state;
    }

    async cancel(requestOptions?: RequestOptions): Promise<void> {
        await this.#client.agents.sessions.cancel(this.sessionId, {}, requestOptions);
    }

    // Expose the autogen Fern Page as-is (it is already async-iterable); no re-wrapping.
    listEvents(
        opts?: TrueFoundryGateway.agents.SessionsListTurnEventsRequest,
        requestOptions?: RequestOptions,
    ): Promise<core.Page<TrueFoundryGateway.TurnEvent, TrueFoundryGateway.agents.SessionsListTurnEventsResponse>> {
        return this.#client.agents.sessions.listTurnEvents(this.sessionId, this.id, opts, requestOptions);
    }
}
