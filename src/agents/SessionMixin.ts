import type * as TrueFoundryGatewayApi from "../api/index.js";
import type { SessionsClient } from "../api/resources/private/resources/agents/resources/sessions/client/Client.js";
import type { TrueFoundryGateway } from "../CustomClient.js";
import * as core from "../core/index.js";
import type { AgentSession } from "./AgentSession.js";
import { PreparedTurn } from "./PreparedTurn.js";
import type { AgentDraftSession } from "./private/AgentDraftSession.js";
import { Turn } from "./Turn.js";

// Per-request overrides (abortSignal / timeoutInSeconds / maxRetries / headers) forwarded to every autogen call.
// SessionsClient is NOT re-exported under TrueFoundryGateway.agents, so import it directly (as AgentSession does).
type RequestOptions = SessionsClient.RequestOptions;

/** The enriched session wrapper that owns a {@link SessionMixin} and is surfaced as `turn.session`. */
export type OwnedSession = AgentSession | AgentDraftSession;

/**
 * Shared turn behavior keyed by a session id. Both {@link AgentSession} and {@link AgentDraftSession}
 * hold a SessionMixin and delegate prepareTurn / listTurns / getTurn / cancel / listEvents to it,
 * so the two session wrappers expose identical turn operations without duplicating logic.
 *
 * The owning wrapper passes itself in at construction so that turns created here expose the enriched
 * wrapper (with `agentName`, `title`, etc.) as `turn.session`, not the bare mixin.
 */
export class SessionMixin {
    /** Unique identifier of the session these turn operations target. */
    readonly id: string;
    readonly #client: TrueFoundryGateway;
    readonly #owner: OwnedSession;

    constructor(id: string, client: TrueFoundryGateway, owner: OwnedSession) {
        this.id = id;
        this.#client = client;
        this.#owner = owner;
    }

    /**
     * Stage a turn locally; call `execute()` to start `createTurn`.
     *
     * @param opts.input - Turn input items passed to createTurn.
     * @param opts.previousTurnId - Previous turn to chain from. Default `auto`.
     * @returns {PreparedTurn} Staged turn.
     */
    prepareTurn(opts?: {
        input?: TrueFoundryGatewayApi.TurnInputItem[];
        previousTurnId?: TrueFoundryGatewayApi.PreviousTurnIdInput;
    }): PreparedTurn {
        return new PreparedTurn(
            { input: opts?.input, previousTurnId: opts?.previousTurnId },
            this.#owner,
            this.#client,
        );
    }

    /**
     * List turns in this session.
     *
     * @param opts.pageToken - Token from the previous response nextPageToken.
     * @param opts.limit - Page size. Default 10.
     * @param requestOptions - Overrides client timeout, retries, abortSignal, headers, queryParams.
     * @returns {core.Page<Turn, TrueFoundryGatewayApi.ListTurnsResponse>} Paginated turns.
     */
    async listTurns(
        opts?: TrueFoundryGatewayApi.agents.SessionsListTurnsRequest,
        requestOptions?: RequestOptions,
    ): Promise<core.Page<Turn, TrueFoundryGatewayApi.ListTurnsResponse>> {
        const client = this.#client;
        const owner = this.#owner;
        const sessionId = this.id;
        const page = await client.agents.sessions.listTurns(sessionId, opts, requestOptions);
        return new core.Page({
            response: page.response,
            rawResponse: page.rawResponse,
            hasNextPage: (response) => !!response?.pagination.nextPageToken,
            getItems: (response) => (response?.data ?? []).map((turn) => new Turn(turn, owner, client)),
            loadPage: (response) =>
                core.HttpResponsePromise.fromPromise(
                    client.agents.sessions
                        .listTurns(
                            sessionId,
                            { ...opts, pageToken: response?.pagination.nextPageToken },
                            requestOptions,
                        )
                        .then((nextPage) => ({ data: nextPage.response, rawResponse: nextPage.rawResponse })),
                ),
        });
    }

    /**
     * Fetch a turn by ID.
     *
     * @param opts.turnId - Unique identifier of the turn to fetch.
     * @param requestOptions - Overrides client timeout, retries, abortSignal, headers, queryParams.
     * @returns {Turn} Turn data.
     */
    async getTurn(opts: { turnId: string }, requestOptions?: RequestOptions): Promise<Turn> {
        const response = await this.#client.agents.sessions.getTurn(this.id, opts.turnId, requestOptions);
        return new Turn(response.data, this.#owner, this.#client);
    }

    /**
     * Cancel the running last turn for the session.
     *
     * @param requestOptions - Overrides client timeout, retries, abortSignal, headers, queryParams.
     * @returns {void}
     */
    async cancel(requestOptions?: RequestOptions): Promise<void> {
        await this.#client.agents.sessions.cancel(this.id, {}, requestOptions);
    }

    /**
     * Paginated session events across turns (newest first); subscribe to a running turn for live events.
     *
     * @param opts.pageToken - Token from the previous response nextPageToken.
     * @param opts.lastTurnId - Newest turn in the listing window (initial load only). Omit to use the session last turn.
     * @param opts.limit - Page size. Default 100.
     * @param requestOptions - Overrides client timeout, retries, abortSignal, headers, queryParams.
     * @returns {Promise<core.Page<TrueFoundryGatewayApi.SessionEventItem, TrueFoundryGatewayApi.ListSessionEventsResponse>>} Paginated session events.
     */
    listEvents(
        opts?: TrueFoundryGatewayApi.agents.SessionsListEventsRequest,
        requestOptions?: RequestOptions,
    ): Promise<core.Page<TrueFoundryGatewayApi.SessionEventItem, TrueFoundryGatewayApi.ListSessionEventsResponse>> {
        return this.#client.agents.sessions.listEvents(this.id, opts, requestOptions);
    }
}
