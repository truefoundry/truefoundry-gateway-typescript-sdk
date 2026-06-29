import type * as TrueFoundryGateway from "../api/index.js";
import type { SessionsClient } from "../api/resources/agents/resources/sessions/client/Client.js";
import type { TrueFoundryGatewayClient } from "../Client.js";
import type * as core from "../core/index.js";
import type { AgentSession } from "./AgentSession.js";
import { Turn } from "./Turn.js";
import { parseSequenceNumber, type TurnStreamEnvelope } from "./TurnStreamEnvelope.js";

// Per-request overrides (abortSignal / timeoutInSeconds / maxRetries / headers) forwarded to every autogen call.
// SessionsClient is NOT re-exported under TrueFoundryGateway.agents, so import it directly (as AgentSessionClient does).
type RequestOptions = SessionsClient.RequestOptions;

export interface PreparedTurnInit {
    input?: TrueFoundryGateway.agents.CreateTurnRequestInputItem[];
    previousTurnId?: TrueFoundryGateway.agents.CreateTurnRequestPreviousTurnId;
}

// Output of prepareTurn: not yet started (no HTTP). execute() fires the createTurn POST and mints
// a real Turn (the only place the createTurn SSE lives), then delegates everything to that inner Turn.
export class PreparedTurn implements Partial<TrueFoundryGateway.Turn> {
    readonly session: AgentSession;
    readonly sessionId: string; // always known from the parent session
    readonly #client: TrueFoundryGatewayClient;
    readonly #input?: TrueFoundryGateway.TurnInputItem[];
    readonly #previousTurnIdInput?: TrueFoundryGateway.agents.CreateTurnRequestPreviousTurnId; // server defaults to 'auto'
    #start?: Promise<core.Stream<TrueFoundryGateway.TurnStreamingEvent>>; // in-flight createTurn; also the one-shot latch
    #turn?: Turn; // the real Turn, created once started

    constructor(init: PreparedTurnInit, session: AgentSession, client: TrueFoundryGatewayClient) {
        this.session = session;
        this.sessionId = session.id;
        this.#client = client;
        this.#input = init.input;
        this.#previousTurnIdInput = init.previousTurnId;
    }

    // Remaining data getters delegate to the inner Turn (undefined until started).
    get id(): string | undefined {
        return this.#turn?.id;
    }
    get previousTurnId(): string | undefined {
        return this.#turn?.previousTurnId;
    }
    get state(): TrueFoundryGateway.TurnState | undefined {
        return this.#turn?.state;
    }
    get createdBySubject(): TrueFoundryGateway.Subject | undefined {
        return this.#turn?.createdBySubject;
    }
    get createdAt(): string | undefined {
        return this.#turn?.createdAt;
    }
    get input(): TrueFoundryGateway.TurnInputItem[] | undefined {
        return this.#turn?.input ?? this.#input;
    }

    // The ONLY initiator. Fires the createTurn POST SYNCHRONOUSLY (stored in #start, which also
    // latches one-shot use), so a second execute() throws before any duplicate request can begin.
    // stream:true (default) -> live iterator over the createTurn run; stream:false -> wait for terminal TurnState.
    // The return type narrows only when `stream` is passed as a boolean literal.
    execute(
        opts: { stream: false; pollIntervalMs?: number },
        requestOptions?: RequestOptions,
    ): Promise<TrueFoundryGateway.TurnState>;
    execute(opts?: { stream?: true }, requestOptions?: RequestOptions): AsyncIterable<TurnStreamEnvelope>;
    execute(
        opts?: { stream?: boolean; pollIntervalMs?: number },
        requestOptions?: RequestOptions,
    ): AsyncIterable<TurnStreamEnvelope> | Promise<TrueFoundryGateway.TurnState> {
        if (this.#start != null) throw new Error("Turn already started; use stream() / waitForCompletion().");
        this.#start = this.openCreateTurn(requestOptions); // POST fires now (synchronously), before we return
        return opts?.stream === false ? this.startAndWait(opts?.pollIntervalMs, requestOptions) : this.runStreaming();
    }

    // Post-execution behaviors. Each throws via mustGetTurn() until execute() has started the turn,
    // then delegates to the inner Turn. stream() here is the re-subscribe path (subscribeToTurn).
    async *stream(
        opts?: { afterSequenceNumber?: number },
        requestOptions?: RequestOptions,
    ): AsyncIterable<TurnStreamEnvelope> {
        yield* this.mustGetTurn().stream(opts, requestOptions);
    }
    async getState(requestOptions?: RequestOptions): Promise<TrueFoundryGateway.TurnState> {
        return this.mustGetTurn().getState(requestOptions);
    }
    async waitForCompletion(
        opts?: { pollIntervalMs?: number },
        requestOptions?: RequestOptions,
    ): Promise<TrueFoundryGateway.TurnState> {
        return this.mustGetTurn().waitForCompletion(opts, requestOptions);
    }
    async cancel(requestOptions?: RequestOptions): Promise<void> {
        return this.mustGetTurn().cancel(requestOptions);
    }
    listEvents(
        opts?: TrueFoundryGateway.agents.SessionsListTurnEventsRequest,
        requestOptions?: RequestOptions,
    ): Promise<core.Page<TrueFoundryGateway.TurnEvent, TrueFoundryGateway.agents.SessionsListTurnEventsResponse>> {
        return this.mustGetTurn().listEvents(opts, requestOptions);
    }

    // execute(stream:true) path: consume the already-open createTurn SSE (#start), adopting the inner Turn on turn.created.
    private async *runStreaming(): AsyncIterable<TurnStreamEnvelope> {
        yield* this.consumeStream(await this.#start!);
    }

    // execute(stream:false) path: drive the open createTurn SSE until turn.created mints the inner Turn, then poll to terminal.
    private async startAndWait(
        pollIntervalMs?: number,
        requestOptions?: RequestOptions,
    ): Promise<TrueFoundryGateway.TurnState> {
        const turn = await this.createTurnIfNotExist();
        return turn.waitForCompletion({ pollIntervalMs }, requestOptions);
    }

    // Consume an SSE stream, adopting the inner Turn from the first turn.created and yielding all events.
    // Isolated so a future reconnect wrapper can re-open the stream (subscribeToTurn) on disconnect.
    // NOTE: reconnect/resume is out of current scope.
    private async *consumeStream(
        sse: core.Stream<TrueFoundryGateway.TurnStreamingEvent>,
    ): AsyncIterable<TurnStreamEnvelope> {
        for await (const { data: event, id } of sse.withMetadata()) {
            if (event.type === "turn.created" && this.#turn == null)
                this.adoptTurn(event); // ctor seeds #state = running
            else this.#turn?.applyEvent(event); // keep inner Turn's #state in sync (e.g. turn.done -> terminal)
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
    private adoptTurn(event: TrueFoundryGateway.TurnCreatedEvent): void {
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
}
