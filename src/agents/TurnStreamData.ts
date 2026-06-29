import type * as TrueFoundryGatewayApi from "../api/index.js";

export interface TurnStreamData {
    sequenceNumber: number;
    event: TrueFoundryGatewayApi.TurnStreamingEvent;
}

export function parseSequenceNumber(id: string | undefined): number {
    if (!id) {
        throw new Error("Missing SSE sequence number id.");
    }
    const parsed = Number(id);
    if (!Number.isFinite(parsed)) {
        throw new Error(`Invalid SSE sequence number id: "${id}".`);
    }
    return parsed;
}
