import type * as TrueFoundryGatewayApi from "../../api/index.js";
import type { TrueFoundryGateway } from "../../CustomClient.js";
import { BaseAgentSession } from "../AgentSession.js";

export class AgentDraftSession extends BaseAgentSession implements TrueFoundryGatewayApi.DraftSession {
    readonly agentName?: string;
    readonly agentSpec: TrueFoundryGatewayApi.AgentSpec;
    constructor(session: TrueFoundryGatewayApi.DraftSession, client: TrueFoundryGateway) {
        super(session, client);
        this.agentName = session.agentName;
        this.agentSpec = session.agentSpec;
    }
}
