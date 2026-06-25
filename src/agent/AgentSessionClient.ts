import type * as TrueFoundryGateway from "../api/index.js";
import { SessionsClient } from "../api/resources/agents/resources/sessions/client/Client.js";
import { TrueFoundryGatewayClient } from "../Client.js";
import * as core from "../core/index.js";
import { AgentSession } from "./AgentSession.js";

export declare namespace AgentSessionClient {
    export type Options = TrueFoundryGatewayClient.Options;
    export type RequestOptions = SessionsClient.RequestOptions;
}

export class AgentSessionClient {
    private readonly client: TrueFoundryGatewayClient;

    constructor(options: AgentSessionClient.Options) {
        this.client = new TrueFoundryGatewayClient(options);
    }

    async createSession(
        opts: TrueFoundryGateway.agents.CreateSessionRequest,
        requestOptions?: AgentSessionClient.RequestOptions,
    ): Promise<AgentSession> {
        const response = await this.client.agents.sessions.create(opts, requestOptions);
        return new AgentSession(response.data, this.client);
    }

    async listSessions(
        opts: TrueFoundryGateway.agents.SessionsListRequest,
        requestOptions?: AgentSessionClient.RequestOptions,
    ): Promise<core.Page<AgentSession, TrueFoundryGateway.agents.SessionsListResponse>> {
        const page = await this.client.agents.sessions.list(opts, requestOptions);
        const client = this.client;
        return new core.Page({
            response: page.response,
            rawResponse: page.rawResponse,
            hasNextPage: (response) => !!response?.pagination.nextPageToken,
            getItems: (response) =>
                (response?.data ?? []).map((session) => new AgentSession(session, client)),
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
