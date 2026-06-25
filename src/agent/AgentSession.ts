import type * as TrueFoundryGateway from "../api/index.js";
import type { TrueFoundryGatewayClient } from "../Client.js";

export class AgentSession implements TrueFoundryGateway.Session {
    readonly id: string;
    readonly agentName: string;
    readonly title?: string;
    readonly createdBySubject: TrueFoundryGateway.SessionSubject;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly #client: TrueFoundryGatewayClient;

    constructor(session: TrueFoundryGateway.Session, client: TrueFoundryGatewayClient) {
        this.id = session.id;
        this.agentName = session.agentName;
        this.title = session.title;
        this.createdBySubject = session.createdBySubject;
        this.createdAt = session.createdAt;
        this.updatedAt = session.updatedAt;
        this.#client = client;
    }
}
