import { type DeltaEvents, isEventDelta, mergeEventDelta } from "../../../src/agent/eventDelta.js";
import type * as TrueFoundryGateway from "../../../src/api/index.js";

const EVENT_ID = "0f3a9c2b-7d41-4e8a-b2c6-1a5f9e3d2b48";
const THREAD_ID = "thread-1";

function modelMessageBase(
    overrides: Partial<TrueFoundryGateway.ModelMessageEvent> = {},
): TrueFoundryGateway.ModelMessageEvent {
    return {
        type: "model.message",
        id: EVENT_ID,
        threadId: THREAD_ID,
        createdAt: "2026-01-01T00:00:00Z",
        ...overrides,
    };
}

function modelMessageDelta(
    overrides: Partial<TrueFoundryGateway.ModelMessageDeltaEvent> = {},
): TrueFoundryGateway.ModelMessageDeltaEvent {
    return {
        type: "model.message.delta",
        id: EVENT_ID,
        threadId: THREAD_ID,
        ...overrides,
    };
}

describe("isEventDelta", () => {
    it("returns true for model.message.delta", () => {
        expect(isEventDelta(modelMessageDelta())).toBe(true);
    });

    it("returns false for representative non-delta types", () => {
        expect(
            isEventDelta({
                type: "model.message",
                id: EVENT_ID,
                threadId: THREAD_ID,
                createdAt: "2026-01-01T00:00:00Z",
            }),
        ).toBe(false);
        expect(
            isEventDelta({
                type: "tool.response",
                id: EVENT_ID,
                threadId: THREAD_ID,
                toolCallId: "tc-1",
                content: "ok",
                createdAt: "2026-01-01T00:00:00Z",
            }),
        ).toBe(false);
        expect(
            isEventDelta({
                type: "turn.done",
                id: EVENT_ID,
                state: { status: "done", requiredActions: [] },
                createdAt: "2026-01-01T00:00:00Z",
            }),
        ).toBe(false);
        expect(
            isEventDelta({
                type: "thread.created",
                id: EVENT_ID,
                threadId: THREAD_ID,
                title: "t",
                createdAt: "2026-01-01T00:00:00Z",
                agentInfo: { type: "dynamic", name: "a", input: "{}" },
                parent: { threadId: "parent-thread", toolCallId: "tc-1" },
            }),
        ).toBe(false);
    });

    it("narrows to DeltaEvents in a type guard branch", () => {
        const event: TrueFoundryGateway.TurnStreamingEvent = modelMessageDelta({ content: "x" });
        if (isEventDelta(event)) {
            const delta: DeltaEvents = event;
            expect(delta.type).toBe("model.message.delta");
        } else {
            throw new Error("expected delta");
        }
    });
});

describe("mergeEventDelta / content", () => {
    it("merges the headline Hello! scenario", () => {
        const base = modelMessageBase({ content: "" });
        mergeEventDelta(base, modelMessageDelta({ content: "Hel" }));
        mergeEventDelta(base, modelMessageDelta({ content: "lo" }));
        mergeEventDelta(base, modelMessageDelta({ content: "!", finishReason: "stop" }));

        expect(base.content).toBe("Hello!");
        expect(base.finishReason).toBe("stop");
    });

    it("seeds content from undefined", () => {
        const base = modelMessageBase();
        mergeEventDelta(base, modelMessageDelta({ content: "Hi" }));
        expect(base.content).toBe("Hi");
    });

    it("treats empty-string delta content as a no-op", () => {
        const base = modelMessageBase({ content: "Hi" });
        mergeEventDelta(base, modelMessageDelta({ content: "" }));
        expect(base.content).toBe("Hi");
    });

    it("appends to trailing text part in array-form content", () => {
        const base = modelMessageBase({
            content: [{ type: "text", text: "Hel" }],
        });
        mergeEventDelta(base, modelMessageDelta({ content: "lo" }));
        mergeEventDelta(base, modelMessageDelta({ content: "!" }));
        expect(base.content).toEqual([{ type: "text", text: "Hello!" }]);
    });

    it("pushes a new text part when the last part is non-text", () => {
        const base = modelMessageBase({
            content: [{ type: "refusal", refusal: "no" }],
        });
        mergeEventDelta(base, modelMessageDelta({ content: "Hi" }));
        expect(base.content).toEqual([
            { type: "refusal", refusal: "no" },
            { type: "text", text: "Hi" },
        ]);
    });

    it("concatenates refusal chunks", () => {
        const base = modelMessageBase();
        mergeEventDelta(base, modelMessageDelta({ refusal: "Can" }));
        mergeEventDelta(base, modelMessageDelta({ refusal: "not" }));
        expect(base.refusal).toBe("Cannot");
    });
});

describe("mergeEventDelta / toolCalls", () => {
    const toolInfo: TrueFoundryGateway.McpToolCallInfo = {
        type: "mcp",
        serverId: "srv-1",
        serverName: "weather",
        name: "get_weather",
    };

    it("accumulates function.arguments across deltas; sets id/name/type on first chunk", () => {
        const base = modelMessageBase();
        mergeEventDelta(
            base,
            modelMessageDelta({
                toolCalls: [
                    {
                        index: 0,
                        id: "call_1",
                        type: "function",
                        function: { name: "get_weather", arguments: '{"a":' },
                        toolInfo,
                    },
                ],
            }),
        );
        mergeEventDelta(
            base,
            modelMessageDelta({
                toolCalls: [{ index: 0, function: { arguments: "1}" } }],
            }),
        );

        expect(base.toolCalls).toHaveLength(1);
        expect(base.toolCalls?.[0]).toMatchObject({
            id: "call_1",
            type: "function",
            function: { name: "get_weather", arguments: '{"a":1}' },
            toolInfo,
        });
    });

    it("accumulates two tool calls at index 0 and 1 independently", () => {
        const base = modelMessageBase();
        mergeEventDelta(
            base,
            modelMessageDelta({
                toolCalls: [
                    { index: 0, id: "c0", type: "function", function: { name: "a", arguments: "1" }, toolInfo },
                    { index: 1, id: "c1", type: "function", function: { name: "b", arguments: "2" }, toolInfo },
                ],
            }),
        );
        mergeEventDelta(
            base,
            modelMessageDelta({
                toolCalls: [
                    { index: 0, function: { arguments: "3" } },
                    { index: 1, function: { arguments: "4" } },
                ],
            }),
        );

        expect(base.toolCalls?.[0]?.function.arguments).toBe("13");
        expect(base.toolCalls?.[1]?.function.arguments).toBe("24");
    });

    it("copies toolInfo and merges providerSpecificFields", () => {
        const base = modelMessageBase();
        mergeEventDelta(
            base,
            modelMessageDelta({
                toolCalls: [
                    {
                        index: 0,
                        id: "c0",
                        type: "function",
                        function: { name: "fn", arguments: "" },
                        toolInfo,
                        providerSpecificFields: { a: 1 },
                    },
                ],
            }),
        );
        mergeEventDelta(
            base,
            modelMessageDelta({
                toolCalls: [{ index: 0, providerSpecificFields: { b: 2 } }],
            }),
        );

        expect(base.toolCalls?.[0]?.toolInfo).toEqual(toolInfo);
        expect(base.toolCalls?.[0]?.providerSpecificFields).toEqual({ a: 1, b: 2 });
    });
});

describe("mergeEventDelta / usage", () => {
    const usage: TrueFoundryGateway.ModelMessageUsage = {
        inputTokens: 10611,
        outputTokens: 84,
        inputTokensBreakdown: {
            harness: 7824,
            skills: 0,
            instructions: 0,
            toolDefinitions: 1093,
            messages: 1694,
        },
    };

    it("sets usage from a delta", () => {
        const base = modelMessageBase();
        mergeEventDelta(base, modelMessageDelta({ usage }));
        expect(base.usage).toEqual(usage);
    });

    it("overwrites usage when a later delta carries an update", () => {
        const base = modelMessageBase();
        mergeEventDelta(base, modelMessageDelta({ usage: { ...usage, outputTokens: 10 } }));
        mergeEventDelta(base, modelMessageDelta({ usage }));
        expect(base.usage?.outputTokens).toBe(84);
    });
});

describe("mergeEventDelta / dispatch and id semantics", () => {
    it("throws when base id and delta id differ", () => {
        const base = modelMessageBase({ id: "base-id" });
        const delta = modelMessageDelta({ id: "delta-id", content: "x" });
        expect(() => mergeEventDelta(base, delta)).toThrow(
            'Cannot merge delta into a different event: base id "base-id" != delta id "delta-id".',
        );
        expect(base.content).toBeUndefined();
    });

    it("is a safe no-op when ids match but types mismatch", () => {
        const base: TrueFoundryGateway.ToolResponseEvent = {
            type: "tool.response",
            id: EVENT_ID,
            threadId: THREAD_ID,
            toolCallId: "tc-1",
            content: "ok",
            createdAt: "2026-01-01T00:00:00Z",
        };
        mergeEventDelta(base, modelMessageDelta({ content: "ignored" }));
        expect(base.content).toBe("ok");
    });

    it("assembles interleaved events keyed by id", () => {
        const events = new Map<string, TrueFoundryGateway.TurnEvent>();
        const stream: TrueFoundryGateway.TurnStreamingEvent[] = [
            modelMessageBase({ id: "msg-a", content: "" }),
            modelMessageBase({ id: "msg-b", content: "" }),
            modelMessageDelta({ id: "msg-a", content: "A" }),
            modelMessageDelta({ id: "msg-b", content: "B" }),
            modelMessageDelta({ id: "msg-a", content: "!" }),
        ];

        for (const message of stream) {
            if (isEventDelta(message)) {
                mergeEventDelta(events.get(message.id)!, message);
            } else {
                events.set(message.id, message as TrueFoundryGateway.TurnEvent);
            }
        }

        expect((events.get("msg-a") as TrueFoundryGateway.ModelMessageEvent).content).toBe("A!");
        expect((events.get("msg-b") as TrueFoundryGateway.ModelMessageEvent).content).toBe("B");
    });
});
