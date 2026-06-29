import type * as TrueFoundryGateway from "../api/index.js";

/** Union of all streaming delta events. Expand this as more `.delta` events are added. */
export type DeltaEvents = TrueFoundryGateway.ModelMessageDeltaEvent;

export function isEventDelta(event: TrueFoundryGateway.TurnStreamingEvent): event is DeltaEvents {
    return typeof event.type === "string" && event.type.endsWith(".delta");
}

export function mergeEventDelta(base: TrueFoundryGateway.TurnEvent, delta: DeltaEvents): void {
    if (base.id !== delta.id) {
        throw new Error(`Cannot merge delta into a different event: base id "${base.id}" != delta id "${delta.id}".`);
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

    if (delta.toolCalls) {
        base.toolCalls ??= [];
        for (const d of delta.toolCalls) {
            let tc = base.toolCalls[d.index];
            if (tc === undefined) {
                tc = {
                    id: d.id ?? "",
                    type: (d.type ?? "function") as "function",
                    function: { name: d.function?.name ?? "", arguments: "" },
                    ...(d.toolInfo != null ? { toolInfo: d.toolInfo as TrueFoundryGateway.ToolInfo } : {}),
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
                tc.toolInfo = d.toolInfo as TrueFoundryGateway.ToolInfo;
            }
            if (d.providerSpecificFields) {
                tc.providerSpecificFields = {
                    ...(tc.providerSpecificFields ?? {}),
                    ...d.providerSpecificFields,
                };
            }
        }
    }

    if (delta.finishReason) {
        base.finishReason = delta.finishReason;
    }

    if (delta.reasoningContent) {
        base.reasoningContent = (base.reasoningContent ?? "") + delta.reasoningContent;
    }

    if (delta.usage) {
        base.usage = delta.usage;
    }
}
