import type * as TrueFoundryGatewayApi from "../api/index.js";
import type { SessionsClient } from "../api/resources/private/resources/agents/resources/sessions/client/Client.js";
import { TrueFoundryGateway } from "../CustomClient.js";
import * as core from "../core/index.js";
import { AgentSession } from "./AgentSession.js";

export declare namespace AgentSessionClient {
    export type Options = TrueFoundryGateway.Options;
    export type RequestOptions = SessionsClient.RequestOptions;
}

/**
 * Entry-point for the high-level agent API. Wraps TrueFoundryGateway and returns
 * enriched AgentSession objects instead of raw response types.
 */
export class AgentSessionClient {
    private readonly client: TrueFoundryGateway;

    constructor(options: AgentSessionClient.Options) {
        this.client = new TrueFoundryGateway(options);
    }

    /**
     * Create a new session for a named agent.
     *
     * @param opts.agentName - Name of the agent to create a session for.
     * @param requestOptions - Overrides client timeout, retries, abortSignal, headers, queryParams.
     * @returns {AgentSession} Session created.
     */
    async createSession(
        opts: TrueFoundryGatewayApi.agents.CreateSessionRequest,
        requestOptions?: AgentSessionClient.RequestOptions,
    ): Promise<AgentSession> {
        const response = await this.client.agents.sessions.create(opts, requestOptions);
        return new AgentSession(response.data, this.client);
    }

    /**
     * List sessions for an agent.
     *
     * @param opts.agentName - Name of the agent whose sessions to list.
     * @param opts.limit - Page size. Default 10.
     * @param opts.order - Sort by creation time. Default `desc`.
     * @param opts.pageToken - Token from the previous response nextPageToken.
     * @param opts.startTimestamp - Inclusive lower bound on createdAt (ISO-8601).
     * @param opts.endTimestamp - Inclusive upper bound on createdAt (ISO-8601).
     * @param requestOptions - Overrides client timeout, retries, abortSignal, headers, queryParams.
     * @returns {core.Page<AgentSession, TrueFoundryGatewayApi.ListSessionsResponse>} Paginated sessions.
     */
    async listSessions(
        opts: TrueFoundryGatewayApi.agents.SessionsListRequest,
        requestOptions?: AgentSessionClient.RequestOptions,
    ): Promise<core.Page<AgentSession, TrueFoundryGatewayApi.ListSessionsResponse>> {
        const page = await this.client.agents.sessions.list(opts, requestOptions);
        const client = this.client;
        return new core.Page({
            response: page.response,
            rawResponse: page.rawResponse,
            hasNextPage: (response) => !!response?.pagination.nextPageToken,
            getItems: (response) => (response?.data ?? []).map((session) => new AgentSession(session, client)),
            loadPage: (response) =>
                core.HttpResponsePromise.fromPromise(
                    client.agents.sessions
                        .list({ ...opts, pageToken: response?.pagination.nextPageToken }, requestOptions)
                        .then((nextPage) => ({
                            data: nextPage.response,
                            rawResponse: nextPage.rawResponse,
                        })),
                ),
        });
    }

    /**
     * Fetch a session by ID.
     *
     * @param opts.sessionId - Unique identifier of the session to fetch.
     * @param requestOptions - Overrides client timeout, retries, abortSignal, headers, queryParams.
     * @returns {AgentSession} Session data.
     */
    async getSession(
        opts: { sessionId: string },
        requestOptions?: AgentSessionClient.RequestOptions,
    ): Promise<AgentSession> {
        const response = await this.client.agents.sessions.get(opts.sessionId, requestOptions);
        return new AgentSession(response.data, this.client);
    }
}
