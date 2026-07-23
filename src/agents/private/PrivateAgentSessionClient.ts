import type * as TrueFoundryGatewayApi from "../../api/index.js";
import type { SessionsClient } from "../../api/resources/private/resources/agents/resources/sessions/client/Client.js";
import { TrueFoundryGateway } from "../../CustomClient.js";
import * as core from "../../core/index.js";
import { AgentSession } from "../AgentSession.js";
import { AgentDraftSession } from "./AgentDraftSession.js";

export declare namespace PrivateAgentSessionClient {
    export type Options = TrueFoundryGateway.Options;
    export type RequestOptions = SessionsClient.RequestOptions;
}

/**
 * High-level client for caller-scoped agent session internals: draft session create/get and listings
 * that span a subject's saved sessions and drafts, returning enriched {@link AgentSession} /
 * {@link AgentDraftSession} objects instead of raw response types.
 */
export class PrivateAgentSessionClient {
    private readonly client: TrueFoundryGateway;

    constructor(options: PrivateAgentSessionClient.Options) {
        this.client = new TrueFoundryGateway(options);
    }

    /**
     * Create a draft session holding an inline agent spec, optionally linked to a saved agent.
     *
     * @param opts.agentSpec - Inline agent spec held by the draft.
     * @param opts.agentName - Optionally link the draft to an existing saved agent. Omit for a standalone draft.
     * @param opts.tfyMetadata - Optional request metadata (x-tfy-metadata) persisted at creation.
     * @param requestOptions - Overrides client timeout, retries, abortSignal, headers, queryParams.
     * @returns {AgentDraftSession} The created draft session.
     */
    async createDraftSession(
        request: TrueFoundryGatewayApi.agents.private_.CreateDraftSessionRequest,
        requestOptions?: PrivateAgentSessionClient.RequestOptions,
    ): Promise<AgentDraftSession> {
        const response = await this.client.agents.private.draftSessions.create(request, requestOptions);
        return new AgentDraftSession(response.data, this.client);
    }

    /**
     * Fetch a draft session by ID (owner-only).
     *
     * @param opts.draftSessionId - Unique identifier of the draft session to fetch.
     * @param requestOptions - Overrides client timeout, retries, abortSignal, headers, queryParams.
     * @returns {AgentDraftSession} Draft session data.
     */
    async getDraftSession(
        request: { draftSessionId: string },
        requestOptions?: PrivateAgentSessionClient.RequestOptions,
    ): Promise<AgentDraftSession> {
        const response = await this.client.agents.private.draftSessions.get(request.draftSessionId, requestOptions);
        return new AgentDraftSession(response.data, this.client);
    }

    /**
     * List the caller-owned draft sessions (newest first by default).
     *
     * @param opts.agentName - Filter to drafts linked to this saved agent. Omit for all owned drafts.
     * @param opts.limit - Page size. Default 10.
     * @param opts.order - Sort by creation time. Default `desc`.
     * @param opts.pageToken - Token from the previous response nextPageToken.
     * @param opts.startTimestamp - Inclusive lower bound on createdAt (ISO-8601).
     * @param opts.endTimestamp - Inclusive upper bound on createdAt (ISO-8601).
     * @param requestOptions - Overrides client timeout, retries, abortSignal, headers, queryParams.
     * @returns {core.Page<AgentDraftSession, TrueFoundryGatewayApi.ListDraftSessionsResponse>} Paginated draft sessions.
     */
    async listDraftSessions(
        request: TrueFoundryGatewayApi.agents.private_.DraftSessionsListRequest = {},
        requestOptions?: PrivateAgentSessionClient.RequestOptions,
    ): Promise<core.Page<AgentDraftSession, TrueFoundryGatewayApi.ListDraftSessionsResponse>> {
        const client = this.client;
        const page = await client.agents.private.draftSessions.list(request, requestOptions);
        return new core.Page({
            response: page.response,
            rawResponse: page.rawResponse,
            hasNextPage: (response) => !!response?.pagination.nextPageToken,
            getItems: (response) => (response?.data ?? []).map((draft) => new AgentDraftSession(draft, client)),
            loadPage: (response) =>
                core.HttpResponsePromise.fromPromise(
                    client.agents.private.draftSessions
                        .list({ ...opts, pageToken: response?.pagination.nextPageToken }, requestOptions)
                        .then((nextPage) => ({ data: nextPage.response, rawResponse: nextPage.rawResponse })),
                ),
        });
    }

    /**
     * List all sessions owned by the caller, spanning both saved sessions and drafts (newest first by default).
     *
     * @param opts.agentName - Filter to sessions linked to this saved agent. Omit for all owned sessions.
     * @param opts.limit - Page size. Default 10.
     * @param opts.order - Sort by creation time. Default `desc`.
     * @param opts.pageToken - Token from the previous response nextPageToken.
     * @param opts.startTimestamp - Inclusive lower bound on createdAt (ISO-8601).
     * @param opts.endTimestamp - Inclusive upper bound on createdAt (ISO-8601).
     * @param requestOptions - Overrides client timeout, retries, abortSignal, headers, queryParams.
     * @returns {core.Page<AgentSession | AgentDraftSession, TrueFoundryGatewayApi.ListOwnedSessionsResponse>} Paginated owned sessions.
     */
    async listOwnedSessions(
        request: TrueFoundryGatewayApi.agents.private_.PrivateListOwnedSessionsRequest = {},
        requestOptions?: PrivateAgentSessionClient.RequestOptions,
    ): Promise<core.Page<AgentSession | AgentDraftSession, TrueFoundryGatewayApi.ListOwnedSessionsResponse>> {
        const client = this.client;
        const page = await client.agents.private.listOwnedSessions(request, requestOptions);
        return new core.Page({
            response: page.response,
            rawResponse: page.rawResponse,
            hasNextPage: (response) => !!response?.pagination.nextPageToken,
            getItems: (response) => (response?.data ?? []).map((raw) => this.wrapOwnedSession(raw)),
            loadPage: (response) =>
                core.HttpResponsePromise.fromPromise(
                    client.agents.private.sessions
                        .listOwnedSessions({ ...opts, pageToken: response?.pagination.nextPageToken }, requestOptions)
                        .then((nextPage) => ({ data: nextPage.response, rawResponse: nextPage.rawResponse })),
                ),
        });
    }

    // Wrap a raw owned-session union member into its enriched wrapper, keyed off the `type` discriminant.
    private wrapOwnedSession(
        raw: TrueFoundryGatewayApi.ListOwnedSessionsResponseDataItem,
    ): AgentSession | AgentDraftSession {
        switch (raw.type) {
            case "session/draft":
                return new AgentDraftSession(raw, this.client);
            case "session":
                return new AgentSession(raw, this.client);
            default:
                throw new Error(`Unknown owned session type`);
        }
    }

    /**
     * Download a sandbox file by ID.
     *
     * @param opts.sandboxId - Unique identifier of the sandbox file to download.
     * @param requestOptions - Overrides client timeout, retries, abortSignal, headers, queryParams.
     * @returns {core.BinaryResponse} The downloaded sandbox file.
     */
    downloadSandboxFile(
        sandboxId: string,
        request: TrueFoundryGatewayApi.agents.private_.PrivateDownloadSandboxFileRequest,
        requestOptions?: PrivateAgentSessionClient.RequestOptions,
    ): core.HttpResponsePromise<core.BinaryResponse> {
        return this.client.agents.private.downloadSandboxFile(sandboxId, request, requestOptions);
    }
}
