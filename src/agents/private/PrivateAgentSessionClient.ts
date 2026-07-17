import type * as TrueFoundryGatewayApi from "../../api/index.js";
import * as core from "../../core/index.js";
import { AgentSession } from "../AgentSession.js";
import { AgentSessionClient } from "../AgentSessionClient.js";
import { SessionMixin } from "../SessionMixin.js";
import { AgentDraftSession } from "./AgentDraftSession.js";

/**
 * High-level client for caller-scoped ("owned") agent sessions. Extends {@link AgentSessionClient}
 * with listings that span a subject's saved sessions and drafts, returning enriched
 * {@link AgentSession} / {@link AgentDraftSession} objects instead of raw response types.
 */
export class PrivateAgentSessionClient extends AgentSessionClient {
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
        opts: TrueFoundryGatewayApi.agents.private_.DraftSessionsListRequest = {},
        requestOptions?: AgentSessionClient.RequestOptions,
    ): Promise<core.Page<AgentDraftSession, TrueFoundryGatewayApi.ListDraftSessionsResponse>> {
        const client = this.client;
        const page = await client.agents.private.draftSessions.list(opts, requestOptions);
        return new core.Page({
            response: page.response,
            rawResponse: page.rawResponse,
            hasNextPage: (response) => !!response?.pagination.nextPageToken,
            getItems: (response) =>
                (response?.data ?? []).map((draft) => new AgentDraftSession(draft, new SessionMixin(draft.id, client))),
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
        opts: TrueFoundryGatewayApi.agents.private_.SessionsListOwnedSessionsRequest = {},
        requestOptions?: AgentSessionClient.RequestOptions,
    ): Promise<core.Page<AgentSession | AgentDraftSession, TrueFoundryGatewayApi.ListOwnedSessionsResponse>> {
        const client = this.client;
        const page = await client.agents.private.sessions.listOwnedSessions(opts, requestOptions);
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
        const mixin = new SessionMixin(raw.id, this.client);
        switch (raw.type) {
            case "session/draft":
                return new AgentDraftSession(raw, mixin);
            case "session":
                return new AgentSession(raw, mixin);
            default:
                throw new Error(`Unknown owned session type`);
        }
    }
}
