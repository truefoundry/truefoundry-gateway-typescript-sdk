import type * as TrueFoundryGatewayApi from "../api/index.js";

/** An SSE item with a TurnStreamingEvent; `sequenceNumber` is the SSE event id for resuming via `subscribeToTurn`. */
export interface TurnStreamData {
    sequenceNumber: number;
    event: TrueFoundryGatewayApi.TurnStreamingEvent;
}

/** Parse the SSE `id` field as a sequence number. */
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
