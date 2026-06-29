import type { AgentsClient } from "./api/resources/private/resources/agents/client/Client.js";
import { TrueFoundryGatewayClient as BaseTrueFoundryGatewayClient } from "./Client";
import type * as core from "./core";

export declare namespace TrueFoundryGatewayClient {
    export type Options = Omit<BaseTrueFoundryGatewayClient.Options, "environment"> & {
        baseUrl: core.Supplier<string>;
        environment?: core.Supplier<string>;
    };

    export interface RequestOptions extends BaseTrueFoundryGatewayClient.RequestOptions {}
}

export class TrueFoundryGatewayClient extends BaseTrueFoundryGatewayClient {
    protected _agents: AgentsClient | undefined;

    constructor(_options: TrueFoundryGatewayClient.Options) {
        const options = {
            ..._options,
            environment: _options.environment ?? "",
        } as BaseTrueFoundryGatewayClient.Options;
        super(options);
    }

    public get agents(): AgentsClient {
        return (this._agents ??= this.private.agents);
    }
}
