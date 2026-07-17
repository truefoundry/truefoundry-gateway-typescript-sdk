import type * as TrueFoundryGatewayApi from "../api/index.js";
import type { SessionsClient } from "../api/resources/private/resources/agents/resources/sessions/client/Client.js";
import type { TrueFoundryGateway } from "../CustomClient.js";
import type * as core from "../core/index.js";
import type { PreparedTurn } from "./PreparedTurn.js";
import { SessionMixin } from "./SessionMixin.js";
import type { Turn } from "./Turn.js";

// Per-request overrides (abortSignal / timeoutInSeconds / maxRetries / headers) forwarded to every autogen call.
// SessionsClient is NOT re-exported under TrueFoundryGateway.agents, so import it directly (as AgentSessionClient does).
type RequestOptions = SessionsClient.RequestOptions;

/**
 * A session enriched with convenience methods: prepareTurn, listTurns, getTurn, listEvents, cancel.
 * Turn operations are delegated to a shared {@link SessionMixin}.
 */
export class AgentSession implements TrueFoundryGatewayApi.Session {
    /** Discriminant distinguishing a saved session from a draft session. */
    readonly type: "session" = "session";
    /** Unique identifier of this session. */
    readonly id: string;
    /** Name of the agent for this session. */
    readonly agentName: string;
    /** Optional user-visible title for the session. */
    readonly title?: string;
    /** Subject that created this session. */
    readonly createdBySubject: TrueFoundryGatewayApi.Subject;
    /** ISO-8601 timestamp when the session was created. */
    readonly createdAt: string;
    /** ISO-8601 timestamp when the session was last updated. */
    readonly updatedAt: string;
    readonly #mixin: SessionMixin;

    constructor(session: TrueFoundryGatewayApi.Session, client: TrueFoundryGateway) {
        this.id = session.id;
        this.agentName = session.agentName;
        this.title = session.title;
        this.createdBySubject = session.createdBySubject;
        this.createdAt = session.createdAt;
        this.updatedAt = session.updatedAt;
        this.#mixin = new SessionMixin(session.id, client, this);
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
        return this.#mixin.prepareTurn(opts);
    }

    /**
     * List turns in this session.
     *
     * @param opts.pageToken - Token from the previous response nextPageToken.
     * @param opts.limit - Page size. Default 10.
     * @param requestOptions - Overrides client timeout, retries, abortSignal, headers, queryParams.
     * @returns {core.Page<Turn, TrueFoundryGatewayApi.ListTurnsResponse>} Paginated turns.
     */
    listTurns(
        opts?: TrueFoundryGatewayApi.agents.SessionsListTurnsRequest,
        requestOptions?: RequestOptions,
    ): Promise<core.Page<Turn, TrueFoundryGatewayApi.ListTurnsResponse>> {
        return this.#mixin.listTurns(opts, requestOptions);
    }

    /**
     * Fetch a turn by ID.
     *
     * @param opts.turnId - Unique identifier of the turn to fetch.
     * @param requestOptions - Overrides client timeout, retries, abortSignal, headers, queryParams.
     * @returns {Turn} Turn data.
     */
    getTurn(opts: { turnId: string }, requestOptions?: RequestOptions): Promise<Turn> {
        return this.#mixin.getTurn(opts, requestOptions);
    }

    /**
     * Cancel the running last turn for the session.
     *
     * @param requestOptions - Overrides client timeout, retries, abortSignal, headers, queryParams.
     * @returns {void}
     */
    cancel(requestOptions?: RequestOptions): Promise<void> {
        return this.#mixin.cancel(requestOptions);
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
        return this.#mixin.listEvents(opts, requestOptions);
    }
}
