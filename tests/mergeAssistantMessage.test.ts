/**
 * Unit tests for mergeAssistantMessage (mirrors gateway accumulateTokensFromChunk).
 */
import { describe, expect, it } from "vitest";

import { type EnrichedAssistantMessage, isAssistantDelta, mergeAssistantMessage } from "../src/helpers/index.js";
import type { TruefoundryGateway } from "../src/index.js";

type Delta = TruefoundryGateway.AgentLlmMessageDelta;

const EXEC = "exec_1";
const PARENT = "49098506-0137-41e1-9017-88804bf81fad";
const CHILD = "3786add1-fa41-4124-aaa9-30861eb6eb3b";

function d(partial: Partial<Delta>, executionId = EXEC): Delta {
    return { type: "agent.message", role: "assistant", execution_id: executionId, ...partial } as Delta;
}

function fold(chunks: Delta[]): EnrichedAssistantMessage {
    let cur: EnrichedAssistantMessage | null = null;
    for (const c of chunks) cur = mergeAssistantMessage(cur, c);
    if (!cur) throw new Error("expected non-null");
    return cur;
}

function foldTurns(chunks: Delta[]): EnrichedAssistantMessage[] {
    const turns: EnrichedAssistantMessage[] = [];
    let cur: EnrichedAssistantMessage | null = null;
    for (const chunk of chunks) {
        cur = mergeAssistantMessage(cur, chunk);
        if (cur.finish_reason) {
            turns.push(cur);
            cur = null;
        }
    }
    return turns;
}

/** End-to-end: filter non-assistant events, merge deltas, snapshot on finish_reason. */
function replayStream(events: Array<Record<string, unknown>>): EnrichedAssistantMessage[] {
    const turns: EnrichedAssistantMessage[] = [];
    let cur: EnrichedAssistantMessage | null = null;
    for (const event of events) {
        if (!isAssistantDelta(event)) continue;
        cur = mergeAssistantMessage(cur, event as Delta);
        if (cur.finish_reason) {
            turns.push(cur);
            cur = null;
        }
    }
    return turns;
}

describe("mergeAssistantMessage", () => {
    it("isAssistantDelta distinguishes assistant deltas from tool/lifecycle events", () => {
        expect(isAssistantDelta({ type: "agent.message", role: "assistant" })).toBe(true);
        expect(isAssistantDelta({ type: "agent.message" })).toBe(true);
        expect(isAssistantDelta({ type: "agent.message", role: "tool" })).toBe(false);
        for (const type of ["response.created", "mcp.initialize", "agent.done", "response.done"]) {
            expect(isAssistantDelta({ type })).toBe(false);
        }
    });

    it("merges content + finish_reason and drops reasoning_content", () => {
        const merged = fold([
            d({ reasoning_content: "plan the tool call" } as Partial<Delta>),
            d({ content: "Both approaches returned the same result. " }),
            d({ content: "Here's a side-by-side comparison." }),
            d({ finish_reason: "stop" }),
        ]);
        expect(merged.content).toBe("Both approaches returned the same result. Here's a side-by-side comparison.");
        expect(merged.finish_reason).toBe("stop");
        expect("reasoning_content" in merged).toBe(false);
    });

    it("folds thinking blocks until a signature closes one, then opens a new block", () => {
        const multi = fold([
            d({ thinking_blocks: [{ type: "thinking", thinking: "The user wants details via the sandbox, " }] }),
            d({ thinking_blocks: [{ type: "thinking", thinking: "using the mcp-client tool." }] }),
            d({ thinking_blocks: [{ type: "thinking", thinking: "", signature: "sig_1" }] }),
            d({ thinking_blocks: [{ type: "thinking", thinking: "Summarize for the user." }] }),
        ]);
        expect(multi.thinking_blocks).toHaveLength(2);
        expect((multi.thinking_blocks![0] as { thinking: string }).thinking).toBe(
            "The user wants details via the sandbox, using the mcp-client tool.",
        );
        expect((multi.thinking_blocks![0] as { signature?: string }).signature).toBe("sig_1");

        const redacted = fold([d({ thinking_blocks: [{ type: "redacted_thinking", data: "blob" }] })]);
        expect((redacted.thinking_blocks![0] as { type: string }).type).toBe("redacted_thinking");
    });

    it("merges tool_calls, preserves first tool_info, pads empty slots", () => {
        const merged = fold([
            d({
                tool_calls: [
                    {
                        index: 0,
                        id: "toolu_0",
                        type: "function",
                        function: { name: "exec", arguments: '{"intent": ' },
                    },
                ],
            }),
            d({ tool_calls: [{ index: 0, function: { arguments: '"Get user details", ' } }] }),
            d({
                tool_calls: [{ index: 0, function: { arguments: '"command": "mcp-client get_me {}"}' } }],
            }),
            d({
                tool_calls: [
                    {
                        index: 0,
                        tool_info: {
                            mcp_server_id: "sandbox",
                            mcp_server_name: "sandbox",
                            original_tool_name: "exec",
                        },
                    },
                ],
            }),
            d({ finish_reason: "tool_calls" }),
        ]);
        expect(merged.tool_calls![0]!.function.arguments).toBe(
            '{"intent": "Get user details", "command": "mcp-client get_me {}"}',
        );
        expect(merged.tool_calls![0]!.tool_info?.mcp_server_name).toBe("sandbox");
        expect(merged.finish_reason).toBe("tool_calls");

        const padded = fold([
            d({
                tool_calls: [{ index: 1, id: "toolu_1", function: { name: "exec", arguments: "{}" } }],
            }),
        ]);
        expect(padded.tool_calls).toHaveLength(2);
        expect(padded.tool_calls![0]!.id).toBe("");
        expect(padded.tool_calls![1]!.id).toBe("toolu_1");
    });

    it("supports multi-turn folding and per-execution keying", () => {
        const turns = foldTurns([
            d({
                tool_calls: [{ index: 0, id: "toolu_0", function: { name: "exec", arguments: '{"cmd":' } }],
            }),
            d({ tool_calls: [{ index: 0, function: { arguments: '"ls"}' } }] }),
            d({ finish_reason: "tool_calls" }),
            d({ content: "Done." }),
            d({ finish_reason: "stop" }),
        ]);
        expect(turns).toHaveLength(2);
        expect(turns[0]!.tool_calls![0]!.function.arguments).toBe('{"cmd":"ls"}');
        expect(turns[1]!.content).toBe("Done.");

        const byExec = new Map<string, EnrichedAssistantMessage | null>();
        for (const chunk of [
            d({ content: "Parent " }, PARENT),
            d({ content: "Child " }, CHILD),
            d({ content: "turn." }, PARENT),
            d({ content: "turn." }, CHILD),
        ]) {
            byExec.set(chunk.execution_id, mergeAssistantMessage(byExec.get(chunk.execution_id) ?? null, chunk));
        }
        expect(byExec.get(PARENT)!.content).toBe("Parent turn.");
        expect(byExec.get(CHILD)!.content).toBe("Child turn.");
    });

    it("replays a mixed SSE stream and produces per-turn snapshots", () => {
        const thinking =
            "The user wants details via the sandbox, using the mcp-client tool. Let me run both approaches.";
        const turns = replayStream([
            { type: "response.created", response_id: "g.test" },
            d({ reasoning_content: thinking } as Partial<Delta>),
            d({
                tool_calls: [
                    {
                        index: 0,
                        id: "toolu_0",
                        type: "function",
                        function: { name: "exec", arguments: '{"intent": "Get user details", ' },
                        tool_info: {
                            mcp_server_id: "sandbox",
                            mcp_server_name: "sandbox",
                            original_tool_name: "exec",
                        },
                    },
                ],
            }),
            d({
                tool_calls: [{ index: 0, function: { arguments: '"command": "mcp-client get_me {}"}' } }],
            }),
            d({
                thinking_blocks: [{ type: "thinking", thinking, signature: "sig_a" }],
                finish_reason: "tool_calls",
            }),
            {
                type: "agent.message",
                role: "tool",
                execution_id: EXEC,
                tool_call_id: "toolu_0",
                content: '{"success":true}',
            },
            d({ content: "Both approaches returned the same result. " }),
            d({ content: "Here's a side-by-side comparison." }),
            d({ finish_reason: "stop" }),
            { type: "response.done", status: "done" },
        ]);

        expect(turns).toHaveLength(2);
        expect(turns[0]!.tool_calls![0]!.function.arguments).toBe(
            '{"intent": "Get user details", "command": "mcp-client get_me {}"}',
        );
        expect(turns[0]!.tool_calls![0]!.tool_info?.mcp_server_name).toBe("sandbox");
        expect((turns[0]!.thinking_blocks![0] as { thinking: string }).thinking).toBe(thinking);
        expect(turns[0]!.finish_reason).toBe("tool_calls");
        expect(turns[0]!.content).toBeUndefined();
        expect(turns[1]!.content).toBe("Both approaches returned the same result. Here's a side-by-side comparison.");
        expect(turns[1]!.finish_reason).toBe("stop");
    });
});
