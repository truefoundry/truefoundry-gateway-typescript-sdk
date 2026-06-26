import type * as TrueFoundryGateway from "../api/index.js";

/** Union of all streaming delta events. Expand this as more `.delta` events are added. */
export type DeltaEvents = TrueFoundryGateway.ModelMessageDeltaEvent;

export function isEventDelta(
    event: TrueFoundryGateway.TurnStreamingEvent,
): event is DeltaEvents {
    return typeof event.type === "string" && event.type.endsWith(".delta");
}

export function mergeEventDelta(base: TrueFoundryGateway.TurnEvent, delta: DeltaEvents): void {
    if (base.id !== delta.id) {
        throw new Error(
            `Cannot merge delta into a different event: base id "${base.id}" != delta id "${delta.id}".`,
        );
    }
    if (delta.type === "model.message.delta" && base.type === "model.message") {
        mergeModelMessageDelta(base, delta);
    }
}

function mergeModelMessageDelta(
    base: TrueFoundryGateway.ModelMessageEvent,
    delta: TrueFoundryGateway.ModelMessageDeltaEvent,
): void {
    if (delta.content) {
        if (base.content === undefined || typeof base.content === "string") {
            base.content = (base.content ?? "") + delta.content;
        } else {
            const last = base.content[base.content.length - 1];
            if (last && last.type === "text") {
                last.text += delta.content;
            } else {
                base.content.push({ type: "text", text: delta.content });
            }
        }
    }

    if (delta.refusal) {
        base.refusal = (base.refusal ?? "") + delta.refusal;
    }

    if (delta.functionCall) {
        base.functionCall ??= { name: "", arguments: "" };
        if (delta.functionCall.name) {
            base.functionCall.name = delta.functionCall.name;
        }
        if (delta.functionCall.arguments) {
            base.functionCall.arguments += delta.functionCall.arguments;
        }
    }

    if (delta.toolCalls) {
        base.toolCalls ??= [];
        for (const d of delta.toolCalls) {
            let tc = base.toolCalls[d.index];
            if (tc === undefined) {
                tc = {
                    id: d.id ?? "",
                    type: (d.type ?? "function") as "function",
                    function: { name: d.function?.name ?? "", arguments: "" },
                    ...(d.toolInfo != null
                        ? { toolInfo: d.toolInfo as TrueFoundryGateway.ToolCallToolInfo }
                        : {}),
                } as TrueFoundryGateway.ToolCall;
                base.toolCalls[d.index] = tc;
            }
            if (d.id) {
                tc.id = d.id;
            }
            if (d.type) {
                tc.type = d.type;
            }
            if (d.function?.name) {
                tc.function.name = d.function.name;
            }
            if (d.function?.arguments) {
                tc.function.arguments += d.function.arguments;
            }
            if (d.toolInfo) {
                tc.toolInfo = d.toolInfo as TrueFoundryGateway.ToolCallToolInfo;
            }
            if (d.providerSpecificFields) {
                tc.providerSpecificFields = {
                    ...(tc.providerSpecificFields ?? {}),
                    ...d.providerSpecificFields,
                };
            }
        }
    }

    if (delta.thinkingBlocks) {
        base.thinkingBlocks ??= [];
        for (let i = 0; i < delta.thinkingBlocks.length; i++) {
            const d = delta.thinkingBlocks[i]!;
            const b = base.thinkingBlocks[i];
            if (b === undefined) {
                base.thinkingBlocks[i] = d as TrueFoundryGateway.ModelMessageEventThinkingBlocksItem;
            } else if (b.type === "thinking" && d.type === "thinking") {
                b.thinking += d.thinking;
                if (d.signature) {
                    b.signature = d.signature;
                }
            } else if (b.type === "redacted_thinking" && d.type === "redacted_thinking") {
                b.data += d.data;
            } else {
                base.thinkingBlocks[i] = d as TrueFoundryGateway.ModelMessageEventThinkingBlocksItem;
            }
        }
    }

    if (delta.finishReason) {
        base.finishReason = delta.finishReason;
    }

    // TODO: merge delta.reasoningContent once ModelMessageEvent gains a `reasoningContent` field.
}
