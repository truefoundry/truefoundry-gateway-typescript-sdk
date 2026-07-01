import type * as TrueFoundryGatewayApi from "../api/index.js";
import type { SessionsClient } from "../api/resources/private/resources/agents/resources/sessions/client/Client.js";
import type { TrueFoundryGateway } from "../CustomClient.js";
import * as core from "../core/index.js";
import { PreparedTurn } from "./PreparedTurn.js";
import { Turn } from "./Turn.js";

// Per-request overrides (abortSignal / timeoutInSeconds / maxRetries / headers) forwarded to every autogen call.
// SessionsClient is NOT re-exported under TrueFoundryGateway.agents, so import it directly (as AgentSessionClient does).
type RequestOptions = SessionsClient.RequestOptions;

/**
 * A session enriched with convenience methods: prepareTurn, listTurns, getTurn, cancel.
 */
export class AgentSession implements TrueFoundryGatewayApi.Session {
    readonly id: string;
    readonly agentName: string;
    readonly title?: string;
    readonly createdBySubject: TrueFoundryGatewayApi.Subject;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly #client: TrueFoundryGateway;

    constructor(session: TrueFoundryGatewayApi.Session, client: TrueFoundryGateway) {
        this.id = session.id;
        this.agentName = session.agentName;
        this.title = session.title;
        this.createdBySubject = session.createdBySubject;
        this.createdAt = session.createdAt;
        this.updatedAt = session.updatedAt;
        this.#client = client;
    }

    /** Stage a turn locally (no HTTP). Omit `previousTurnId` to chain to the session's last turn (server default `auto`). Call `execute()` once to start `createTurn`. */
    prepareTurn(opts?: {
        input?: TrueFoundryGatewayApi.TurnInputItem[];
        previousTurnId?: TrueFoundryGatewayApi.PreviousTurnIdInput;
    }): PreparedTurn {
        return new PreparedTurn({ input: opts?.input, previousTurnId: opts?.previousTurnId }, this, this.#client);
    }

    /** List turns in this session. */
    async listTurns(
        opts?: TrueFoundryGatewayApi.agents.SessionsListTurnsRequest,
        requestOptions?: RequestOptions,
    ): Promise<core.Page<Turn, TrueFoundryGatewayApi.ListTurnsResponse>> {
        const client = this.#client;
        const sessionId = this.id;
        const page = await client.agents.sessions.listTurns(sessionId, opts, requestOptions);
        return new core.Page({
            response: page.response,
            rawResponse: page.rawResponse,
            hasNextPage: (response) => !!response?.pagination.nextPageToken,
            getItems: (response) => (response?.data ?? []).map((turn) => new Turn(turn, this, client)),
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

    /** Fetch a turn by ID. */
    async getTurn(opts: { turnId: string }, requestOptions?: RequestOptions): Promise<Turn> {
        const response = await this.#client.agents.sessions.getTurn(this.id, opts.turnId, requestOptions);
        return new Turn(response.data, this, this.#client);
    }

    /** Cancel the running last turn for the session. */
    async cancel(requestOptions?: RequestOptions): Promise<void> {
        await this.#client.agents.sessions.cancel(this.id, {}, requestOptions);
    }
}
