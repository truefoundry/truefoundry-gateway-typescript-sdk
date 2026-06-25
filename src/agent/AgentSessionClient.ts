import type * as TrueFoundryGateway from "../api/index.js";
import { TrueFoundryGatewayClient } from "../Client.js";
import { AgentSession } from "./AgentSession.js";

export declare namespace AgentSessionClient {
    export type Options = TrueFoundryGatewayClient.Options;
}

export class AgentSessionClient {
    private readonly client: TrueFoundryGatewayClient;

    constructor(options: AgentSessionClient.Options) {
        this.client = new TrueFoundryGatewayClient(options);
    }

    async createSession(opts: TrueFoundryGateway.agents.CreateSessionRequest): Promise<AgentSession> {
        const response = await this.client.agents.sessions.create(opts);
        return new AgentSession(response.data, this.client);
    }

    async *listSessions(
        opts: TrueFoundryGateway.agents.SessionsListRequest,
    ): AsyncIterable<AgentSession> {
        const page = await this.client.agents.sessions.list(opts);
        for await (const session of page) {
            yield new AgentSession(session, this.client);
        }
    }

    async getSession(opts: { sessionId: string }): Promise<AgentSession> {
        const response = await this.client.agents.sessions.get(opts.sessionId);
        return new AgentSession(response.data, this.client);
    }
}
