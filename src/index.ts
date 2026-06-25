// This file is hand-maintained (listed in .fernignore). It re-exports the
// Fern-generated top-level symbols verbatim. When Fern adds or removes
// top-level exports in future regens, sync the Fern-owned section below from
// `src/index.ts` on the `release-v<version>` branch produced by the release
// workflow.
//
// Fern-generated exports (sync from regen):
export * as TruefoundryGateway from "./api/index.js";
export type { BaseClientOptions, BaseRequestOptions } from "./BaseClient.js";
export { TrueFoundryGatewayClient } from "./Client.js";
export { TrueFoundryGatewayError, TrueFoundryGatewayTimeoutError } from "./errors/index.js";
export * from "./exports.js";

// Hand-written agent session wrapper (.fernignore-protected):
export { AgentSessionClient } from "./agent/index.js";
export type { AgentSession, PreparedTurn, Turn } from "./agent/index.js";
