import { TrueFoundryGatewayClient as BaseTrueFoundryGatewayClient } from "./Client";
import type * as core from "./core";

export interface TrueFoundryGatewayClientOptions extends Omit<BaseTrueFoundryGatewayClient.Options, "environment"> {
    baseUrl: core.Supplier<string>;
    environment?: core.Supplier<string>;
}

export class TrueFoundryGatewayClient extends BaseTrueFoundryGatewayClient {
    constructor(_options: TrueFoundryGatewayClientOptions) {
        const options = {
            ..._options,
            environment: _options.environment ?? "",
        } as BaseTrueFoundryGatewayClient.Options;
        super(options);
    }
}
