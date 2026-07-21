import type * as TrueFoundryGatewayApi from "../../api/index.js";
import type { SessionsClient } from "../../api/resources/private/resources/agents/resources/sessions/client/Client.js";
import type { TrueFoundryGateway } from "../../CustomClient.js";
import type * as core from "../../core/index.js";
import type { PreparedTurn } from "../PreparedTurn.js";
import { SessionMixin } from "../SessionMixin.js";
import type { Turn } from "../Turn.js";

// Per-request overrides (abortSignal / timeoutInSeconds / maxRetries / headers) forwarded to every autogen call.
// SessionsClient is NOT re-exported under TrueFoundryGateway.agents, so import it directly (as AgentSession does).
type RequestOptions = SessionsClient.RequestOptions;

/**
 * A draft session enriched with convenience methods: update (draft-specific) plus the same turn
 * helpers as {@link AgentSession} (prepareTurn, listTurns, getTurn, listEvents, cancel). Turn
 * operations are delegated to a shared {@link SessionMixin}, so drafts and saved sessions expose an
 * identical turn API.
 */
export class AgentDraftSession implements TrueFoundryGatewayApi.DraftSession {
    /** Discriminant distinguishing a draft session from a saved session. */
    readonly type: "session/draft" = "session/draft";
    /** Unique identifier of this draft session. */
    readonly id: string;
    /** Optional saved agent this draft is linked to. */
    readonly agentName?: string;
    /** Optional user-visible title for the draft session. */
    readonly title?: string;
    /** Subject that created this draft session. */
    readonly createdBySubject: TrueFoundryGatewayApi.Subject;
    /** ISO-8601 timestamp when the draft session was created. */
    readonly createdAt: string;
    readonly #client: TrueFoundryGateway;
    readonly #mixin: SessionMixin;
    // Volatile fields refreshed in place by update(); getter-backed to stay read-only externally.
    #agentSpec: TrueFoundryGatewayApi.AgentSpec;
    #updatedAt: string;

    constructor(session: TrueFoundryGatewayApi.DraftSession, client: TrueFoundryGateway) {
        this.id = session.id;
        this.agentName = session.agentName;
        this.title = session.title;
        this.createdBySubject = session.createdBySubject;
        this.createdAt = session.createdAt;
        this.#agentSpec = session.agentSpec;
        this.#updatedAt = session.updatedAt;
        this.#client = client;
        this.#mixin = new SessionMixin(session.id, client);
    }

    /** Inline agent spec held by this draft. Updated in place by `update()`. */
    get agentSpec(): TrueFoundryGatewayApi.AgentSpec {
        return this.#agentSpec;
    }

    /** ISO-8601 timestamp when the draft session was last updated. Updated in place by `update()`. */
    get updatedAt(): string {
        return this.#updatedAt;
    }

    /**
     * Update this draft session's inline agent spec (owner-only). An empty body is a valid no-op that
     * just refreshes `updatedAt`. Mutates `agentSpec` and `updatedAt` on this instance in place.
     *
     * @param opts.agentSpec - New inline agent spec for the draft. Omit to leave the spec unchanged.
     * @param requestOptions - Overrides client timeout, retries, abortSignal, headers, queryParams.
     * @returns {void}
     */
    async update(
        opts: TrueFoundryGatewayApi.agents.private_.UpdateDraftSessionRequest = {},
        requestOptions?: RequestOptions,
    ): Promise<void> {
        const response = await this.#client.agents.private.draftSessions.update(this.id, opts, requestOptions);
        this.#agentSpec = response.data.agentSpec;
        this.#updatedAt = response.data.updatedAt;
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
        return this.#mixin.prepareTurn(this, opts);
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
        return this.#mixin.listTurns(this, opts, requestOptions);
    }

    /**
     * Fetch a turn by ID.
     *
     * @param opts.turnId - Unique identifier of the turn to fetch.
     * @param requestOptions - Overrides client timeout, retries, abortSignal, headers, queryParams.
     * @returns {Turn} Turn data.
     */
    getTurn(opts: { turnId: string }, requestOptions?: RequestOptions): Promise<Turn> {
        return this.#mixin.getTurn(this, opts, requestOptions);
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
