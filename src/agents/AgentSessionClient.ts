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
     * @param request.agentName - Name of an existing agent in the tenant.
     * @param request.tfyMetadata - Optional request metadata (x-tfy-metadata) persisted at creation.
     * @param requestOptions - Overrides client timeout, retries, abortSignal, headers, queryParams.
     * @returns {AgentSession} Session created.
     */
    async createSession(
        request: TrueFoundryGatewayApi.agents.CreateSessionRequest,
        requestOptions?: AgentSessionClient.RequestOptions,
    ): Promise<AgentSession> {
        const response = await this.client.agents.sessions.create(request, requestOptions);
        return new AgentSession(response.data, this.client);
    }

    /**
     * List sessions for an agent.
     *
     * @param request.agentName - Name of the agent whose sessions to list.
     * @param request.limit - Page size. Default 10.
     * @param request.order - Sort by creation time. Default `desc`.
     * @param request.pageToken - Token from the previous response nextPageToken.
     * @param request.startTimestamp - Inclusive lower bound on createdAt (ISO-8601).
     * @param request.endTimestamp - Inclusive upper bound on createdAt (ISO-8601).
     * @param requestOptions - Overrides client timeout, retries, abortSignal, headers, queryParams.
     * @returns {core.Page<AgentSession, TrueFoundryGatewayApi.ListSessionsResponse>} Paginated sessions.
     */
    async listSessions(
        request: TrueFoundryGatewayApi.agents.SessionsListRequest,
        requestOptions?: AgentSessionClient.RequestOptions,
    ): Promise<core.Page<AgentSession, TrueFoundryGatewayApi.ListSessionsResponse>> {
        const page = await this.client.agents.sessions.list(request, requestOptions);
        const client = this.client;
        return new core.Page({
            response: page.response,
            rawResponse: page.rawResponse,
            hasNextPage: (response) => !!response?.pagination.nextPageToken,
            getItems: (response) => (response?.data ?? []).map((session) => new AgentSession(session, client)),
            loadPage: (response) =>
                core.HttpResponsePromise.fromPromise(
                    client.agents.sessions
                        .list({ ...request, pageToken: response?.pagination.nextPageToken }, requestOptions)
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
     * @param request.sessionId - Unique identifier of the session to fetch.
     * @param requestOptions - Overrides client timeout, retries, abortSignal, headers, queryParams.
     * @returns {AgentSession} Session data.
     */
    async getSession(
        request: { sessionId: string },
        requestOptions?: AgentSessionClient.RequestOptions,
    ): Promise<AgentSession> {
        const response = await this.client.agents.sessions.get(request.sessionId, requestOptions);
        return new AgentSession(response.data, this.client);
    }
}
