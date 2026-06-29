import { fromJson } from "../json.js";
import { RUNTIME } from "../runtime/index.js";

export declare namespace Stream {
    interface Args {
        /**
         * The HTTP response stream to read from.
         */

        stream: ReadableStream;

        /**
         * The event shape to use for parsing the stream data.
         */
        eventShape: JsonEvent | SseEvent;
        /**
         * An abort signal to stop the stream.
         */
        signal?: AbortSignal;
    }

    interface JsonEvent {
        type: "json";
        messageTerminator: string;
    }

    interface SseEvent {
        type: "sse";
        streamTerminator?: string;
        eventDiscriminator?: string;
    }
}

export interface ServerSentEvent<T> {
    data: T;
    id?: string;
    retry?: number;
    event?: string;
}

const DATA_PREFIX = "data:";
const EVENT_PREFIX = "event:";
const ID_PREFIX = "id:";
const RETRY_PREFIX = "retry:";

export class Stream<T> implements AsyncIterable<T> {
    private stream: ReadableStream;

    private parse: (val: unknown) => Promise<T>;
    private readonly eventShape: Stream.JsonEvent | Stream.SseEvent;
    private controller: AbortController = new AbortController();
    private decoder: TextDecoder | undefined;

    constructor({ stream, parse, eventShape, signal }: Stream.Args & { parse: (val: unknown) => Promise<T> }) {
        this.stream = stream;
        this.parse = parse;
        this.eventShape = eventShape;
        signal?.addEventListener("abort", () => this.controller.abort());

        // Initialize shared TextDecoder
        if (typeof TextDecoder !== "undefined") {
            this.decoder = new TextDecoder("utf-8");
        }
    }

    private async *iterMessages(): AsyncGenerator<ServerSentEvent<T>, void> {
        if (this.eventShape.type === "json") {
            yield* this.iterJsonMessages();
        } else if (this.eventShape.eventDiscriminator != null) {
            yield* this.iterSseEvents();
        } else {
            yield* this.iterDataMessages();
        }
    }

    private async *iterJsonMessages(): AsyncGenerator<ServerSentEvent<T>, void> {
        const { messageTerminator } = this.eventShape as Stream.JsonEvent;
        const stream = readableStreamAsyncIterable<any>(this.stream);
        let buf = "";
        for await (const chunk of stream) {
            buf += this.decodeChunk(chunk);

            let terminatorIndex: number;
            while ((terminatorIndex = buf.indexOf(messageTerminator)) >= 0) {
                const line = buf.slice(0, terminatorIndex).replace(/\r$/, "");
                buf = buf.slice(terminatorIndex + messageTerminator.length);

                if (!line.trim()) {
                    continue;
                }

                const data = await this.parse(fromJson(line));
                yield { data, id: undefined, retry: undefined, event: undefined };
            }
        }
    }

    private async *iterDataMessages(): AsyncGenerator<ServerSentEvent<T>, void> {
        const stream = readableStreamAsyncIterable<any>(this.stream);
        let buf = "";
        let dataValue: string | undefined;
        let lastId: string | undefined;
        let lastRetry: number | undefined;

        for await (const chunk of stream) {
            buf += this.decodeChunk(chunk);

            let terminatorIndex: number;
            while ((terminatorIndex = buf.indexOf("\n")) >= 0) {
                const line = buf.slice(0, terminatorIndex).replace(/\r$/, "");
                buf = buf.slice(terminatorIndex + 1);

                if (!line.trim()) {
                    if (dataValue != null) {
                        const data = await this.dispatchDataMessage(dataValue);
                        if (data == null) {
                            return;
                        }
                        yield { data, id: lastId, retry: lastRetry, event: undefined };
                    }
                    dataValue = undefined;
                    continue;
                }

                if (line.startsWith(EVENT_PREFIX)) {
                } else if (line.startsWith(DATA_PREFIX)) {
                    const val = line.slice(DATA_PREFIX.length).trim();
                    dataValue = dataValue != null ? `${dataValue}\n${val}` : val;
                } else if (line.startsWith(ID_PREFIX)) {
                    const idValue = line.slice(ID_PREFIX.length).trim();
                    if (!idValue.includes("\0")) {
                        lastId = idValue;
                    }
                } else if (line.startsWith(RETRY_PREFIX)) {
                    const retryValue = line.slice(RETRY_PREFIX.length).trim();
                    const parsed = parseInt(retryValue, 10);
                    if (!Number.isNaN(parsed) && String(parsed) === retryValue) {
                        lastRetry = parsed;
                    }
                }
            }
        }

        if (dataValue != null) {
            const data = await this.dispatchDataMessage(dataValue);
            if (data != null) {
                yield { data, id: lastId, retry: lastRetry, event: undefined };
            }
        }
    }

    private async *iterSseEvents(): AsyncGenerator<ServerSentEvent<T>, void> {
        const stream = readableStreamAsyncIterable<any>(this.stream);
        let buf = "";
        let eventType: string | undefined;
        let dataValue: string | undefined;
        let lastId: string | undefined;
        let lastRetry: number | undefined;

        for await (const chunk of stream) {
            buf += this.decodeChunk(chunk);

            let terminatorIndex: number;
            while ((terminatorIndex = buf.indexOf("\n")) >= 0) {
                const line = buf.slice(0, terminatorIndex).replace(/\r$/, "");
                buf = buf.slice(terminatorIndex + 1);

                if (!line.trim()) {
                    if (dataValue != null) {
                        const data = await this.dispatchSseEvent(dataValue, eventType);
                        if (data == null) {
                            return;
                        }
                        yield { data, id: lastId, retry: lastRetry, event: eventType };
                    }
                    eventType = undefined;
                    dataValue = undefined;
                    continue;
                }

                if (line.startsWith(EVENT_PREFIX)) {
                    eventType = line.slice(EVENT_PREFIX.length).trim();
                } else if (line.startsWith(DATA_PREFIX)) {
                    const val = line.slice(DATA_PREFIX.length).trim();
                    dataValue = dataValue != null ? `${dataValue}\n${val}` : val;
                } else if (line.startsWith(ID_PREFIX)) {
                    const idValue = line.slice(ID_PREFIX.length).trim();
                    if (!idValue.includes("\0")) {
                        lastId = idValue;
                    }
                } else if (line.startsWith(RETRY_PREFIX)) {
                    const retryValue = line.slice(RETRY_PREFIX.length).trim();
                    const parsed = parseInt(retryValue, 10);
                    if (!Number.isNaN(parsed) && String(parsed) === retryValue) {
                        lastRetry = parsed;
                    }
                }
            }
        }

        if (dataValue != null) {
            const data = await this.dispatchSseEvent(dataValue, eventType);
            if (data != null) {
                yield { data, id: lastId, retry: lastRetry, event: eventType };
            }
        }
    }

    /**
     * Parses a single SSE data payload for the non-discriminator path.
     * Returns null when the payload is a stream terminator.
     */
    private async dispatchDataMessage(dataValue: string): Promise<T | null> {
        const { streamTerminator } = this.eventShape as Stream.SseEvent;
        if (streamTerminator != null && dataValue.includes(streamTerminator)) {
            return null;
        }
        return this.parse(fromJson(dataValue));
    }

    /**
     * Parses and returns a single SSE event, or returns null if the event is a stream terminator.
     */
    private async dispatchSseEvent(dataValue: string, eventType: string | undefined): Promise<T | null> {
        const { streamTerminator } = this.eventShape as Stream.SseEvent;
        if (streamTerminator != null && dataValue.includes(streamTerminator)) {
            return null;
        }
        return this.parse(this.injectDiscriminator(fromJson(dataValue), eventType));
    }

    public withMetadata(): AsyncIterable<ServerSentEvent<T>> {
        const self = this;
        return {
            async *[Symbol.asyncIterator]() {
                yield* self.iterMessages();
            },
        };
    }

    private injectDiscriminator(parsed: unknown, eventType: string | undefined): unknown {
        const eventDiscriminator = (this.eventShape as Stream.SseEvent).eventDiscriminator;
        if (eventDiscriminator == null || eventType == null) {
            return parsed;
        }
        if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
            return parsed;
        }
        const obj = parsed as Record<string, unknown>;
        if (eventDiscriminator in obj) {
            return parsed;
        }
        return { [eventDiscriminator]: eventType, ...obj };
    }

    async *[Symbol.asyncIterator](): AsyncIterator<T, void, unknown> {
        for await (const event of this.iterMessages()) {
            yield event.data;
        }
    }

    private decodeChunk(chunk: any): string {
        let decoded = "";
        // If TextDecoder is available, use the streaming decoder instance
        if (this.decoder != null) {
            decoded += this.decoder.decode(chunk, { stream: true });
        }
        // Buffer is present in Node.js environment
        else if (RUNTIME.type === "node" && typeof chunk !== "undefined") {
            decoded += Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        }
        return decoded;
    }
}

/**
 * Browser polyfill for ReadableStream
 */
// biome-ignore lint/suspicious/noExplicitAny: allow explicit any
export function readableStreamAsyncIterable<T>(stream: any): AsyncIterableIterator<T> {
    if (stream[Symbol.asyncIterator]) {
        return stream;
    }

    const reader = stream.getReader();
    return {
        async next() {
            try {
                const result = await reader.read();
                if (result?.done) {
                    reader.releaseLock();
                } // release lock when stream becomes closed
                return result;
            } catch (e) {
                reader.releaseLock(); // release lock when stream becomes errored
                throw e;
            }
        },
        async return() {
            const cancelPromise = reader.cancel();
            reader.releaseLock();
            await cancelPromise;
            return { done: true, value: undefined };
        },
        [Symbol.asyncIterator]() {
            return this;
        },
    };
}
