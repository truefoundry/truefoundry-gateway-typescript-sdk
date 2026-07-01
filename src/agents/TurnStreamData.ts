import type * as TrueFoundryGatewayApi from "../api/index.js";

export interface TurnStreamData {
    /** SSE event id for resume via subscribeToTurn. */
    sequenceNumber: number;
    /** Streaming event payload from the turn SSE stream. */
    event: TrueFoundryGatewayApi.TurnStreamingEvent;
}

/**
 * Parse the SSE `id` field as a sequence number.
 *
 * @param id - SSE event id string used as sequence number.
 * @returns {number} Parsed sequence number from the SSE event id.
 */
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
