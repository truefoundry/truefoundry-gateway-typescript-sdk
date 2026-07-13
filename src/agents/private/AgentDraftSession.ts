import type * as TrueFoundryGatewayApi from "../../api/index.js";
import type { DraftSessionsClient } from "../../api/resources/private/resources/agents/resources/private/resources/draftSessions/client/Client.js";
import type { TrueFoundryGateway } from "../../CustomClient.js";
import { BaseAgentSession } from "../AgentSession.js";

export class AgentDraftSession extends BaseAgentSession implements TrueFoundryGatewayApi.DraftSession {
    /** Name of the agent for this draft session. */
    readonly agentName?: string;
    /** The agent specification for this session. */
    agentSpec: TrueFoundryGatewayApi.AgentSpec;
    /** ISO-8601 timestamp when the session was last updated. */
    updatedAt: string;
    constructor(session: TrueFoundryGatewayApi.DraftSession, client: TrueFoundryGateway) {
        super(session, client);
        this.agentName = session.agentName;
        this.agentSpec = session.agentSpec;
        this.updatedAt = session.updatedAt;
    }

    async update(
        agentSpec: TrueFoundryGatewayApi.AgentSpec,
        requestOptions?: DraftSessionsClient.RequestOptions,
    ): Promise<void> {
        const response = await this.client.agents.private.draftSessions.update(this.id, { agentSpec }, requestOptions);
        this.agentSpec = response.data.agentSpec;
        this.updatedAt = response.data.updatedAt;
    }
}
