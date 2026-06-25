import type * as TrueFoundryGateway from "../api/index.js";
import type { TrueFoundryGatewayClient } from "../Client.js";

export class AgentSession implements TrueFoundryGateway.Session {
    readonly id: string;
    readonly agent_name?: string;
    readonly title?: string;
    readonly created_by_subject: TrueFoundryGateway.SessionSubject;
    readonly created_at: string;
    readonly updated_at: string;
    readonly #client: TrueFoundryGatewayClient;

    constructor(session: TrueFoundryGateway.Session, client: TrueFoundryGatewayClient) {
        this.id = session.id;
        this.agent_name = session.agent_name;
        this.title = session.title;
        this.created_by_subject = session.created_by_subject;
        this.created_at = session.created_at;
        this.updated_at = session.updated_at;
        this.#client = client;
    }
}
