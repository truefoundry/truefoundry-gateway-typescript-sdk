/**
 * Fold `agent.message` assistant-role chunks (`AgentLlmMessageDelta`) emitted
 * by `client.agents.responses.create` into a single rolling
 * `EnrichedAssistantMessage`.
 *
 * Pure reducer — pass the previous result back in for each chunk. Caller
 * responsibilities (not handled here):
 * - Filter with {@link isAssistantDelta} (skip tool-role messages and lifecycle events).
 * - Reset `current` to `null` after each chunk with `finish_reason` (multiple turns per stream).
 * - Key merge state by `execution_id` when parent/sub-agent streams interleave.
 *
 * Type names mirror the gateway's `src/agent/LLMTypes.ts`:
 * `EnrichedAssistantMessage` (tool_calls carry `tool_info`), `EnrichedToolCall`,
 * `ThinkingBlockUnion`. Behavior mirrors the gateway's
 * `accumulateTokensFromChunk` reducer plus SDK-only fields (`refusal`,
 * `tool_info`). `reasoning_content` is dropped (SSE-only; use
 * `thinking_blocks` instead).
 *
 * Discrimination of thinking blocks and tool-call deltas is done via the
 * `type` / `index` fields on the incoming objects, so this helper does not
 * depend on Fern-generated discriminator class names that may shift across
 * spec revisions.
 */
import type * as TruefoundryGateway from "../api/index.js";

type Delta = TruefoundryGateway.AgentLlmMessageDelta;

/** Folded thinking block — open until `signature` arrives, then closed. Mirrors gateway `ThinkingBlockUnion`. */
export type ThinkingBlockUnion =
    | { type: "thinking"; thinking: string; signature?: string }
    | { type: "redacted_thinking"; data: string };

/** One tool call slot, accumulated by stream `index`. Mirrors gateway `EnrichedToolCall`. */
export interface EnrichedToolCall {
    id: string;
    type: "function";
    function: { name: string; arguments: string };
    /** First chunk with `tool_info` wins; later chunks do not overwrite. */
    tool_info?: TruefoundryGateway.AgentMcpToolCallInfo;
    /** First chunk with `provider_specific_fields` wins; later chunks do not overwrite. */
    provider_specific_fields?: Record<string, unknown>;
}

/**
 * Accumulated assistant message for one turn (until `finish_reason`). Mirrors
 * the gateway's `EnrichedAssistantMessage` (`src/agent/LLMTypes.ts`):
 * `tool_calls` carry `tool_info`, unlike the leaner `RawAssistantMessage`.
 * Not populated by the merge helper: `created_at` (set by gateway on persist if needed).
 */
export interface EnrichedAssistantMessage {
    type: "agent.message";
    role: "assistant";
    execution_id: string;
    content?: string;
    /** Concatenated across chunks (gateway does not fold this yet). */
    refusal?: string;
    thinking_blocks?: ThinkingBlockUnion[];
    tool_calls?: EnrichedToolCall[];
    /** Set from the chunk that carries `finish_reason`; may arrive without content. */
    finish_reason?: TruefoundryGateway.AgentFinishReason | null;
    created_at?: number;
}

/** True for assistant streaming deltas — `agent.message` that is not a tool result. */
export function isAssistantDelta(event: { type?: string; role?: string }): event is Delta {
    return event.type === "agent.message" && event.role !== "tool";
}

/**
 * Merge one assistant delta into rolling state.
 *
 * @param current - Accumulated message so far, or `null` to start a new turn.
 * @param chunk - A single `agent.message` assistant delta from the SSE stream.
 * @returns Updated message. Does not reset on `finish_reason` — caller clears `current`.
 */
export function mergeAssistantMessage(
    current: EnrichedAssistantMessage | null,
    chunk: Delta,
): EnrichedAssistantMessage {
    const m: EnrichedAssistantMessage = current
        ? { ...current }
        : { type: "agent.message", role: "assistant", execution_id: chunk.execution_id, finish_reason: null };

    if (chunk.content) m.content = (m.content ?? "") + chunk.content;
    if (chunk.refusal) m.refusal = (m.refusal ?? "") + chunk.refusal;
    if (chunk.thinking_blocks?.length) m.thinking_blocks = foldThinking(m.thinking_blocks, chunk.thinking_blocks);
    if (chunk.tool_calls?.length) m.tool_calls = foldToolCalls(m.tool_calls, chunk.tool_calls);
    if (chunk.finish_reason) m.finish_reason = chunk.finish_reason;

    return m;
}

function foldThinking(
    acc: ThinkingBlockUnion[] | undefined,
    incoming: TruefoundryGateway.AgentExtendedDeltaThinkingBlocksItem[],
): ThinkingBlockUnion[] {
    const out: ThinkingBlockUnion[] = acc ? [...acc] : [];
    for (const b of incoming) {
        if (b.type === "redacted_thinking") {
            out.push({ type: "redacted_thinking", data: b.data });
            continue;
        }
        const last = out[out.length - 1];
        if (last?.type === "thinking" && !last.signature) {
            out[out.length - 1] = {
                type: "thinking",
                thinking: last.thinking + (b.thinking ?? ""),
                ...(b.signature && { signature: b.signature }),
            };
        } else {
            out.push({
                type: "thinking",
                thinking: b.thinking ?? "",
                ...(b.signature && { signature: b.signature }),
            });
        }
    }
    return out;
}

function foldToolCalls(
    acc: EnrichedToolCall[] | undefined,
    incoming: TruefoundryGateway.AgentExtendedDeltaToolCall[],
): EnrichedToolCall[] {
    const out: EnrichedToolCall[] = acc ? [...acc] : [];
    const empty = (): EnrichedToolCall => ({ id: "", type: "function", function: { name: "", arguments: "" } });
    for (const d of incoming) {
        // Pad empty slots so tool_calls[index] is dense (mirrors Python helper).
        while (out.length <= d.index) {
            out.push(empty());
        }
        const cur = out[d.index]!;
        out[d.index] = {
            ...cur,
            id: d.id || cur.id,
            function: {
                name: d.function?.name || cur.function.name,
                arguments: cur.function.arguments + (d.function?.arguments ?? ""),
            },
            ...(d.tool_info && !cur.tool_info && { tool_info: d.tool_info }),
            ...(d.provider_specific_fields &&
                !cur.provider_specific_fields && {
                    provider_specific_fields: d.provider_specific_fields as Record<string, unknown>,
                }),
        };
    }
    return out;
}
