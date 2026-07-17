import { AgentSession } from "../../../src/agents/AgentSession.js";
import { PreparedTurn } from "../../../src/agents/PreparedTurn.js";
import { AgentDraftSession } from "../../../src/agents/private/AgentDraftSession.js";
import { PrivateAgentSessionClient } from "../../../src/agents/private/PrivateAgentSessionClient.js";
import { mockServerPool } from "../../mock-server/MockServerPool";

const SUBJECT = {
    subject_id: "subject_id",
    subject_type: "subject_type",
    subject_slug: "subject_slug",
};

const RAW_SESSION = {
    type: "session",
    id: "session-1",
    agent_name: "agent_name",
    title: "a session",
    created_by_subject: SUBJECT,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
};

const RAW_DRAFT = {
    type: "session/draft",
    id: "draft-1",
    agent_spec: { model: { name: "gpt-4o" } },
    agent_name: "agent_name",
    title: "a draft",
    created_by_subject: SUBJECT,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
};

function newClient(baseUrl: string): PrivateAgentSessionClient {
    return new PrivateAgentSessionClient({ apiKey: "test", baseUrl, maxRetries: 0 });
}

describe("PrivateAgentSessionClient", () => {
    beforeAll(() => {
        mockServerPool.listen();
    });
    afterAll(() => {
        mockServerPool.close();
    });

    describe("listOwnedSessions", () => {
        it("wraps each union member in the matching class by discriminant", async () => {
            const server = mockServerPool.createServer();
            const client = newClient(server.baseUrl);

            server
                .mockEndpoint({ once: false })
                .get("/v1/x/agents/sessions/owned-sessions")
                .respondWith()
                .statusCode(200)
                .jsonBody({
                    data: [RAW_SESSION, RAW_DRAFT],
                    pagination: { next_page_token: "", previous_page_token: "", limit: 10 },
                })
                .build();

            const page = await client.listOwnedSessions();
            const items = page.data;

            expect(items).toHaveLength(2);

            const [session, draft] = items;
            expect(session).toBeInstanceOf(AgentSession);
            expect(session.type).toBe("session");
            expect(session.id).toBe("session-1");

            expect(draft).toBeInstanceOf(AgentDraftSession);
            expect(draft.type).toBe("session/draft");
            expect(draft.id).toBe("draft-1");
            expect((draft as AgentDraftSession).agentSpec).toEqual({ model: { name: "gpt-4o" } });
        });

        it("paginates via nextPageToken", async () => {
            const server = mockServerPool.createServer();
            const client = newClient(server.baseUrl);

            server
                .mockEndpoint({ once: false })
                .get("/v1/x/agents/sessions/owned-sessions")
                .respondWith()
                .statusCode(200)
                .jsonBody({
                    data: [RAW_SESSION],
                    pagination: { next_page_token: "next", previous_page_token: "", limit: 1 },
                })
                .build();

            const page = await client.listOwnedSessions({ limit: 1 });
            expect(page.hasNextPage()).toBe(true);
            const next = await page.getNextPage();
            expect(next.data[0]).toBeInstanceOf(AgentSession);
        });
    });

    describe("listDraftSessions", () => {
        it("wraps each raw draft in AgentDraftSession", async () => {
            const server = mockServerPool.createServer();
            const client = newClient(server.baseUrl);

            server
                .mockEndpoint({ once: false })
                .get("/v1/agents/draft-sessions")
                .respondWith()
                .statusCode(200)
                .jsonBody({
                    data: [RAW_DRAFT],
                    pagination: { next_page_token: "", previous_page_token: "", limit: 10 },
                })
                .build();

            const page = await client.listDraftSessions();
            expect(page.data).toHaveLength(1);
            expect(page.data[0]).toBeInstanceOf(AgentDraftSession);
            expect(page.data[0]?.id).toBe("draft-1");
        });
    });

    describe("SessionMixin delegation", () => {
        it("prepareTurn returns a PreparedTurn without issuing a request", async () => {
            const server = mockServerPool.createServer();
            const client = newClient(server.baseUrl);

            server
                .mockEndpoint({ once: false })
                .get("/v1/x/agents/sessions/owned-sessions")
                .respondWith()
                .statusCode(200)
                .jsonBody({
                    data: [RAW_DRAFT],
                    pagination: { next_page_token: "", previous_page_token: "", limit: 10 },
                })
                .build();

            const [draft] = (await client.listOwnedSessions()).data;
            expect(draft.prepareTurn()).toBeInstanceOf(PreparedTurn);
        });

        it("listTurns on a draft targets the shared sessions turn route", async () => {
            const server = mockServerPool.createServer();
            const client = newClient(server.baseUrl);

            server
                .mockEndpoint({ once: false })
                .get("/v1/x/agents/sessions/owned-sessions")
                .respondWith()
                .statusCode(200)
                .jsonBody({
                    data: [RAW_DRAFT],
                    pagination: { next_page_token: "", previous_page_token: "", limit: 10 },
                })
                .build();

            server
                .mockEndpoint({ once: false })
                .get("/v1/agents/sessions/draft-1/turns")
                .respondWith()
                .statusCode(200)
                .jsonBody({
                    data: [],
                    pagination: { next_page_token: "", previous_page_token: "", limit: 10 },
                })
                .build();

            const [draft] = (await client.listOwnedSessions()).data;
            const turns = await draft.listTurns();
            expect(turns.data).toEqual([]);
        });
    });
});
