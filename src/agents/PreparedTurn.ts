import type * as TrueFoundryGatewayApi from "../api/index.js";
import type { SessionsClient } from "../api/resources/private/resources/agents/resources/sessions/client/Client.js";
import type { TrueFoundryGateway } from "../CustomClient.js";
import type * as core from "../core/index.js";
import type { BaseAgentSession } from "./AgentSession.js";
import { Turn } from "./Turn.js";
import { parseSequenceNumber, type TurnStreamData } from "./TurnStreamData.js";

// Per-request overrides (abortSignal / timeoutInSeconds / maxRetries / headers) forwarded to every autogen call.
// SessionsClient is NOT re-exported under TrueFoundryGateway.agents, so import it directly (as AgentSessionClient does).
type RequestOptions = SessionsClient.RequestOptions;

export interface PreparedTurnInit {
    input?: TrueFoundryGatewayApi.TurnInputItem[];
    previousTurnId?: TrueFoundryGatewayApi.PreviousTurnIdInput;
}

// Output of prepareTurn: not yet started (no HTTP). execute() fires the createTurn POST and mints
// a real Turn (the only place the createTurn SSE lives), then delegates everything to that inner Turn.
export class PreparedTurn implements Partial<TrueFoundryGatewayApi.Turn> {
    /** Parent session this prepared turn belongs to. */
    readonly session: BaseAgentSession;
    /** Identifier of the parent session. */
    readonly sessionId: string;
    readonly #client: TrueFoundryGateway;
    readonly #input?: TrueFoundryGatewayApi.TurnInputItem[];
    readonly #previousTurnIdInput?: TrueFoundryGatewayApi.PreviousTurnIdInput; // server defaults to 'auto'
    #start?: Promise<core.Stream<TrueFoundryGatewayApi.TurnStreamingEvent>>; // in-flight createTurn; also the one-shot latch
    #turn?: Turn; // the real Turn, created once started

    constructor(init: PreparedTurnInit, session: BaseAgentSession, client: TrueFoundryGateway) {
        this.session = session;
        this.sessionId = session.id;
        this.#client = client;
        this.#input = init.input;
        this.#previousTurnIdInput = init.previousTurnId;
    }

    // Remaining data getters delegate to the inner Turn (undefined until started).
    /**
     * @returns {string | undefined} Undefined until `execute()` starts the turn.
     */
    get id(): string | undefined {
        return this.#turn?.id;
    }

    /**
     * @returns {string | undefined} Undefined until `execute()` starts the turn.
     */
    get previousTurnId(): string | undefined {
        return this.#turn?.previousTurnId;
    }

    /**
     * @returns {TrueFoundryGatewayApi.TurnState | undefined} Undefined until `execute()` starts the turn.
     */
    get state(): TrueFoundryGatewayApi.TurnState | undefined {
        return this.#turn?.state;
    }

    /**
     * @returns {TrueFoundryGatewayApi.Subject | undefined} Undefined until `execute()` starts the turn.
     */
    get createdBySubject(): TrueFoundryGatewayApi.Subject | undefined {
        return this.#turn?.createdBySubject;
    }

    /**
     * @returns {string | undefined} Undefined until `execute()` starts the turn.
     */
    get createdAt(): string | undefined {
        return this.#turn?.createdAt;
    }

    /**
     * @returns {TrueFoundryGatewayApi.TurnInputItem[] | undefined} Staged input before execute; inner turn input after.
     */
    get input(): TrueFoundryGatewayApi.TurnInputItem[] | undefined {
        return this.#turn?.input ?? this.#input;
    }

    // The ONLY initiator. Fires the createTurn POST SYNCHRONOUSLY (stored in #start, which also
    // latches one-shot use), so a second execute() throws before any duplicate request can begin.
    // stream:true (default) -> live iterator over the createTurn run; stream:false -> wait for terminal TurnState.
    // The return type narrows only when `stream` is passed as a boolean literal.

    /**
     * Start the turn via createTurn.
     *
     * @param opts.stream - Stream createTurn SSE when true. Default true.
     * @param opts.pollIntervalMs - Poll interval ms when stream is false. Min 3000.
     * @param requestOptions - Overrides client timeout, retries, abortSignal, headers, queryParams.
     * @returns {TrueFoundryGatewayApi.TurnState | AsyncIterable<TurnStreamData>} Terminal turn state when `stream: false`; SSE stream from createTurn when `stream: true`.
     */
    execute(
        opts: { stream: false; pollIntervalMs?: number },
        requestOptions?: RequestOptions,
    ): Promise<TrueFoundryGatewayApi.TurnState>;
    execute(opts?: { stream?: true }, requestOptions?: RequestOptions): AsyncIterable<TurnStreamData>;
    execute(
        opts?: { stream?: boolean; pollIntervalMs?: number },
        requestOptions?: RequestOptions,
    ): AsyncIterable<TurnStreamData> | Promise<TrueFoundryGatewayApi.TurnState> {
        if (this.#start != null) throw new Error("Turn already started; use stream() / waitForCompletion().");
        this.#start = this.openCreateTurn(requestOptions); // POST fires now (synchronously), before we return
        const { stream = true, pollIntervalMs } = opts ?? {};
        return stream === false ? this.startAndWait(pollIntervalMs, requestOptions) : this.runStreaming();
    }

    // Post-execution behaviors. Each throws via mustGetTurn() until execute() has started the turn,
    // then delegates to the inner Turn. stream() here is the re-subscribe path (subscribeToTurn).
    /**
     * Resubscribe via subscribeToTurn after `execute()`.
     *
     * @param opts.afterSequenceNumber - Sequence number to resume SSE subscription after.
     * @param requestOptions - Overrides client timeout, retries, abortSignal, headers, queryParams.
     * @yields {TurnStreamData} SSE stream items.
     */
    async *stream(
        opts?: { afterSequenceNumber?: number },
        requestOptions?: RequestOptions,
    ): AsyncIterable<TurnStreamData> {
        yield* this.mustGetTurn().stream(opts, requestOptions);
    }

    /**
     * Refetch from the server, update state in-place and return self.
     *
     * @param requestOptions - Overrides client timeout, retries, abortSignal, headers, queryParams.
     * @returns {this} This prepared turn with updated state.
     */
    async refresh(requestOptions?: RequestOptions): Promise<this> {
        await this.mustGetTurn().refresh(requestOptions);
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
        return this.mustGetTurn().waitForCompletion(opts, requestOptions);
    }

    /**
     * Cancel the running last turn for the session.
     *
     * @param requestOptions - Overrides client timeout, retries, abortSignal, headers, queryParams.
     * @returns {void}
     */
    async cancel(requestOptions?: RequestOptions): Promise<void> {
        return this.mustGetTurn().cancel(requestOptions);
    }

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
        return this.mustGetTurn().listEvents(opts, requestOptions);
    }

    // execute(stream:true) path: consume the already-open createTurn SSE (#start), adopting the inner Turn on turn.created.
    private async *runStreaming(): AsyncIterable<TurnStreamData> {
        yield* this.consumeStream(await this.#start!);
    }

    // execute(stream:false) path: drive the open createTurn SSE until turn.created mints the inner Turn, then poll to terminal.
    private async startAndWait(
        pollIntervalMs?: number,
        requestOptions?: RequestOptions,
    ): Promise<TrueFoundryGatewayApi.TurnState> {
        const turn = await this.createTurnIfNotExist();
        return turn.waitForCompletion({ pollIntervalMs }, requestOptions);
    }

    // Consume an SSE stream, adopting the inner Turn from the first turn.created and yielding all events.
    // Isolated so a future reconnect wrapper can re-open the stream (subscribeToTurn) on disconnect.
    // NOTE: reconnect/resume is out of current scope.
    private async *consumeStream(
        sse: core.Stream<TrueFoundryGatewayApi.TurnStreamingEvent>,
    ): AsyncIterable<TurnStreamData> {
        for await (const { data: event, id } of sse.withMetadata()) {
            if (event.type === "turn.created" && this.#turn == null)
                this.adoptTurn(event); // ctor seeds #state = running
            else if (this.#turn != null && event.type === "turn.done") this.replaceTurnState(event.state); // rebuild the inner Turn with the terminal state (state changes are rare)
            yield { sequenceNumber: parseSequenceNumber(id), event };
        }
    }

    // Returns the inner Turn or throws if execute() has not started it yet.
    private mustGetTurn(): Turn {
        if (this.#turn == null) {
            throw new Error("Turn not started yet; call execute() first.");
        }
        return this.#turn;
    }

    // Drive the in-flight createTurn SSE (#start) only until the first turn.created has built the inner
    // Turn, then break (which closes the underlying SSE via the generator's return()). Returns the Turn.
    private async createTurnIfNotExist(): Promise<Turn> {
        if (this.#turn == null) {
            for await (const _event of this.consumeStream(await this.#start!)) {
                if (this.#turn != null) break;
            }
        }
        return this.mustGetTurn();
    }

    // Open the createTurn SSE with the pending input/previousTurnId. Called synchronously by execute()
    // so the POST is in flight (and #start latched) before execute returns.
    private openCreateTurn(requestOptions?: RequestOptions) {
        return this.#client.agents.sessions.createTurn(
            this.sessionId,
            { input: this.#input, previousTurnId: this.#previousTurnIdInput },
            requestOptions,
        );
    }

    // Build the inner Turn directly from the turn.created event (no extra getTurn round trip).
    // The TurnCreatedEvent member of the TurnStreamingEvent union carries everything Turn needs.
    // input comes from the request we sent (this.#input), not the event.
    private adoptTurn(event: TrueFoundryGatewayApi.TurnCreatedEvent): void {
        this.#turn = new Turn(
            {
                id: event.turnId,
                sessionId: this.sessionId,
                previousTurnId: event.previousTurnId,
                input: this.#input,
                state: event.state,
                createdBySubject: event.createdBy,
                createdAt: event.createdAt,
            },
            this.session,
            this.#client,
        );
    }

    // Replace the inner Turn with a fresh one carrying the new state. State changes are rare, so
    // rebuilding via Turn's own constructor (rather than mutating it) keeps Turn the source of truth.
    private replaceTurnState(state: TrueFoundryGatewayApi.TurnState): void {
        const turn = this.mustGetTurn();
        this.#turn = new Turn(
            {
                id: turn.id,
                sessionId: turn.sessionId,
                previousTurnId: turn.previousTurnId,
                input: turn.input,
                state,
                createdBySubject: turn.createdBySubject,
                createdAt: turn.createdAt,
            },
            this.session,
            this.#client,
        );
    }
}
