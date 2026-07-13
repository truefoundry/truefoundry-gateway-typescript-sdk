import type * as TrueFoundryGatewayApi from "../../api/index.js";
import type { DraftSessionsClient } from "../../api/resources/private/resources/agents/resources/private/resources/draftSessions/client/Client.js";
import type { TrueFoundryGateway } from "../../CustomClient.js";
import { BaseAgentSession } from "../AgentSession.js";

export class AgentDraftSession extends BaseAgentSession implements TrueFoundryGatewayApi.DraftSession {
    readonly agentName?: string;
    agentSpec: TrueFoundryGatewayApi.AgentSpec;
    constructor(session: TrueFoundryGatewayApi.DraftSession, client: TrueFoundryGateway) {
        super(session, client);
        this.agentName = session.agentName;
        this.agentSpec = session.agentSpec;
    }

    async update(
        agentSpec: TrueFoundryGatewayApi.AgentSpec,
        requestOptions?: DraftSessionsClient.RequestOptions,
    ): Promise<this> {
        const response = await this.client.agents.private.draftSessions.update(this.id, { agentSpec }, requestOptions);
        this.agentSpec = response.data.agentSpec;
        return this;
    }
}
