// This file is hand-maintained (listed in .fernignore). It re-exports the
// Fern-generated top-level symbols verbatim, plus our custom `helpers/`
// barrel. When Fern adds or removes top-level exports in future regens, sync
// the Fern-owned section below from `src/index.ts` on the
// `release-v<version>` branch produced by the release workflow.
//
// Fern-generated exports (sync from regen):
export * as TruefoundryGateway from "./api/index.js";
export type { BaseClientOptions, BaseRequestOptions } from "./BaseClient.js";
export { TruefoundryGatewayClient } from "./Client.js";
export { TruefoundryGatewayEnvironment } from "./environments.js";
export { TruefoundryGatewayError, TruefoundryGatewayTimeoutError } from "./errors/index.js";
export * from "./exports.js";

// Hand-written helpers (.fernignore-protected):
export {
    type EnrichedAssistantMessage,
    type EnrichedToolCall,
    isAssistantDelta,
    mergeAssistantMessage,
    type ThinkingBlockUnion,
} from "./helpers/index.js";
