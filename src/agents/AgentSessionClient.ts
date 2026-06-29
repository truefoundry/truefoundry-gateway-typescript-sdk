import type * as TrueFoundryGatewayApi from "../api/index.js";
import type { SessionsClient } from "../api/resources/private/resources/agents/resources/sessions/client/Client.js";
import { TrueFoundryGateway } from "../CustomClient.js";
import * as core from "../core/index.js";
import { AgentSession } from "./AgentSession.js";

export declare namespace AgentSessionClient {
    export type Options = TrueFoundryGateway.Options;
    export type RequestOptions = SessionsClient.RequestOptions;
}

export class AgentSessionClient {
    private readonly client: TrueFoundryGateway;

    constructor(options: AgentSessionClient.Options) {
        this.client = new TrueFoundryGateway(options);
    }

    async createSession(
        opts: TrueFoundryGatewayApi.agents.CreateSessionRequest,
        requestOptions?: AgentSessionClient.RequestOptions,
    ): Promise<AgentSession> {
        const response = await this.client.agents.sessions.create(opts, requestOptions);
        return new AgentSession(response.data, this.client);
    }

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

    async getSession(
        opts: { sessionId: string },
        requestOptions?: AgentSessionClient.RequestOptions,
    ): Promise<AgentSession> {
        const response = await this.client.agents.sessions.get(opts.sessionId, requestOptions);
        return new AgentSession(response.data, this.client);
    }
}
