// This file is hand-maintained (listed in .fernignore). It re-exports the
// Fern-generated top-level symbols verbatim. When Fern adds or removes
// top-level exports in future regens, sync the Fern-owned section below from
// `src/index.ts` on the `release-v<version>` branch produced by the release
// workflow.
//
// Fern-generated exports (sync from regen):
export * as TruefoundryGatewayApi from "./api/index.js";
export { TrueFoundryGateway } from "./CustomClient.js";
export { TrueFoundryGatewayError, TrueFoundryGatewayTimeoutError } from "./errors/index.js";
export * from "./exports.js";
