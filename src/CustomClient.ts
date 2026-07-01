import type { AgentsClient } from "./api/resources/private/resources/agents/client/Client.js";
import { TrueFoundryGateway as BaseTrueFoundryGateway } from "./Client.js";
import type * as core from "./core";

export declare namespace TrueFoundryGateway {
    export type Options = Omit<BaseTrueFoundryGateway.Options, "environment"> & {
        baseUrl: core.Supplier<string>;
        environment?: core.Supplier<string>;
    };

    export interface RequestOptions extends BaseTrueFoundryGateway.RequestOptions {}
}

/** Asynchronous client for the TrueFoundry Gateway API. */
export class TrueFoundryGateway extends BaseTrueFoundryGateway {
    protected _agents: AgentsClient | undefined;

    constructor(_options: TrueFoundryGateway.Options) {
        const options = {
            ..._options,
            environment: _options.environment ?? "",
        } as BaseTrueFoundryGateway.Options;
        super(options);
    }

    /** Agent sessions and turns. */
    public get agents(): AgentsClient {
        return (this._agents ??= this.private.agents);
    }
}
