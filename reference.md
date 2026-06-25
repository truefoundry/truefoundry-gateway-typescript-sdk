# Reference
## Agents Sessions
<details><summary><code>client.agents.sessions.<a href="/src/api/resources/agents/resources/sessions/client/Client.ts">list</a>({ ...params }) -> core.Page&lt;TrueFoundryGateway.Session, TrueFoundryGateway.SessionsListResponse&gt;</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

List sessions for an agent (newest first by default), keyset-paginated. Pass `page_token` to fetch the next page, keeping the other query params constant.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
const pageableResponse = await client.agents.sessions.list({
    agentName: "agent_name",
    limit: 1,
    order: "asc",
    pageToken: "page_token",
    startTimestamp: "start_timestamp",
    endTimestamp: "end_timestamp"
});
for await (const item of pageableResponse) {
    console.log(item);
}

// Or you can manually iterate page-by-page
let page = await client.agents.sessions.list({
    agentName: "agent_name",
    limit: 1,
    order: "asc",
    pageToken: "page_token",
    startTimestamp: "start_timestamp",
    endTimestamp: "end_timestamp"
});
while (page.hasNextPage()) {
    page = page.getNextPage();
}

// You can also access the underlying response
const response = page.response;

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `TrueFoundryGateway.agents.SessionsListRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `SessionsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.agents.sessions.<a href="/src/api/resources/agents/resources/sessions/client/Client.ts">create</a>({ ...params }) -> TrueFoundryGateway.SessionsCreateResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Create a session for an existing named agent.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.agents.sessions.create({
    agentName: "agent_name"
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `TrueFoundryGateway.agents.CreateSessionRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `SessionsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.agents.sessions.<a href="/src/api/resources/agents/resources/sessions/client/Client.ts">get</a>(sessionId) -> TrueFoundryGateway.SessionsGetResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Get a session by id. Visible to the session owner or a manager of the session agent.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.agents.sessions.get("sessionId");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**sessionId:** `string` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `SessionsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.agents.sessions.<a href="/src/api/resources/agents/resources/sessions/client/Client.ts">cancel</a>(sessionId, { ...params }) -> TrueFoundryGateway.SessionsCancelResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Cancel the running last turn for a session.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.agents.sessions.cancel("01arz3ndektsv4rrffq69g5fav.g");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**sessionId:** `string` 
    
</dd>
</dl>

<dl>
<dd>

**request:** `TrueFoundryGateway.agents.CancelSessionRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `SessionsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.agents.sessions.<a href="/src/api/resources/agents/resources/sessions/client/Client.ts">listTurns</a>(sessionId, { ...params }) -> core.Page&lt;TrueFoundryGateway.Turn, TrueFoundryGateway.SessionsListTurnsResponse&gt;</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

List turns for a session (newest first). Pagination walks the ancestor chain from the session last turn, or from the turn in page_token when continuing.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
const pageableResponse = await client.agents.sessions.listTurns("01arz3ndektsv4rrffq69g5fav.g", {
    pageToken: "page_token",
    limit: 1
});
for await (const item of pageableResponse) {
    console.log(item);
}

// Or you can manually iterate page-by-page
let page = await client.agents.sessions.listTurns("01arz3ndektsv4rrffq69g5fav.g", {
    pageToken: "page_token",
    limit: 1
});
while (page.hasNextPage()) {
    page = page.getNextPage();
}

// You can also access the underlying response
const response = page.response;

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**sessionId:** `string` 
    
</dd>
</dl>

<dl>
<dd>

**request:** `TrueFoundryGateway.agents.SessionsListTurnsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `SessionsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.agents.sessions.<a href="/src/api/resources/agents/resources/sessions/client/Client.ts">createTurn</a>(sessionId, { ...params }) -> core.Stream&lt;TrueFoundryGateway.TurnStreamingOutputEvent&gt;</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Start or continue a turn within a session. Responds with a Server-Sent Events stream.
Use `previous_turn_id` to chain to the session's last turn (defaults to `auto`).
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
const response = await client.agents.sessions.createTurn("01arz3ndektsv4rrffq69g5fav.g");
for await (const item of response) {
    console.log(item);
}

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**sessionId:** `string` 
    
</dd>
</dl>

<dl>
<dd>

**request:** `TrueFoundryGateway.agents.CreateTurnRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `SessionsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.agents.sessions.<a href="/src/api/resources/agents/resources/sessions/client/Client.ts">getTurn</a>(sessionId, turnId) -> TrueFoundryGateway.SessionsGetTurnResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Get a single turn by ID from Redis.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.agents.sessions.getTurn("01arz3ndektsv4rrffq69g5fav.g", "01arz3ndektsv4rrffq69g5fav.g.ab12cd");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**sessionId:** `string` 
    
</dd>
</dl>

<dl>
<dd>

**turnId:** `string` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `SessionsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.agents.sessions.<a href="/src/api/resources/agents/resources/sessions/client/Client.ts">subscribeToTurn</a>(sessionId, turnId, { ...params }) -> core.Stream&lt;TrueFoundryGateway.TurnStreamingOutputEvent&gt;</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Subscribe to the live SSE stream for a turn. Pass after_sequence_number to resume after disconnect or server timeout, or send Last-Event-Id when after_sequence_number is omitted.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
const response = await client.agents.sessions.subscribeToTurn("01arz3ndektsv4rrffq69g5fav.g", "01arz3ndektsv4rrffq69g5fav.g.ab12cd");
for await (const item of response) {
    console.log(item);
}

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**sessionId:** `string` 
    
</dd>
</dl>

<dl>
<dd>

**turnId:** `string` 
    
</dd>
</dl>

<dl>
<dd>

**request:** `TrueFoundryGateway.agents.SubscribeTurnRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `SessionsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.agents.sessions.<a href="/src/api/resources/agents/resources/sessions/client/Client.ts">listTurnEvents</a>(sessionId, turnId, { ...params }) -> core.Page&lt;TrueFoundryGateway.TurnOutputEvent, TrueFoundryGateway.SessionsListTurnEventsResponse&gt;</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Paginated list of turn events from the Redis events stream.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
const pageableResponse = await client.agents.sessions.listTurnEvents("01arz3ndektsv4rrffq69g5fav.g", "01arz3ndektsv4rrffq69g5fav.g.ab12cd", {
    pageToken: "page_token",
    limit: 1,
    order: "asc"
});
for await (const item of pageableResponse) {
    console.log(item);
}

// Or you can manually iterate page-by-page
let page = await client.agents.sessions.listTurnEvents("01arz3ndektsv4rrffq69g5fav.g", "01arz3ndektsv4rrffq69g5fav.g.ab12cd", {
    pageToken: "page_token",
    limit: 1,
    order: "asc"
});
while (page.hasNextPage()) {
    page = page.getNextPage();
}

// You can also access the underlying response
const response = page.response;

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**sessionId:** `string` 
    
</dd>
</dl>

<dl>
<dd>

**turnId:** `string` 
    
</dd>
</dl>

<dl>
<dd>

**request:** `TrueFoundryGateway.agents.SessionsListTurnEventsRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `SessionsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## Internal Agents DraftSessions
<details><summary><code>client.internal.agents.draftSessions.<a href="/src/api/resources/internal/resources/agents/resources/draftSessions/client/Client.ts">list</a>({ ...params }) -> core.Page&lt;TrueFoundryGateway.DraftSession, TrueFoundryGateway.DraftSessionsListResponse&gt;</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

List the caller-owned draft sessions (newest first by default), keyset-paginated. Optionally filter by `agent_name`. Pass `page_token` to fetch the next page, keeping the other query params constant.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
const pageableResponse = await client.internal.agents.draftSessions.list({
    agentName: "agent_name",
    limit: 1,
    order: "asc",
    pageToken: "page_token",
    startTimestamp: "start_timestamp",
    endTimestamp: "end_timestamp"
});
for await (const item of pageableResponse) {
    console.log(item);
}

// Or you can manually iterate page-by-page
let page = await client.internal.agents.draftSessions.list({
    agentName: "agent_name",
    limit: 1,
    order: "asc",
    pageToken: "page_token",
    startTimestamp: "start_timestamp",
    endTimestamp: "end_timestamp"
});
while (page.hasNextPage()) {
    page = page.getNextPage();
}

// You can also access the underlying response
const response = page.response;

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `TrueFoundryGateway.internal.agents.DraftSessionsListRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `DraftSessionsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.internal.agents.draftSessions.<a href="/src/api/resources/internal/resources/agents/resources/draftSessions/client/Client.ts">create</a>({ ...params }) -> TrueFoundryGateway.DraftSessionsCreateResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Create a draft session holding an inline agent spec, optionally linked to a saved agent. Owner is the token subject.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.internal.agents.draftSessions.create({
    agentSpec: {
        model: {
            name: "name"
        }
    }
});

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**request:** `TrueFoundryGateway.internal.agents.CreateDraftSessionRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `DraftSessionsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.internal.agents.draftSessions.<a href="/src/api/resources/internal/resources/agents/resources/draftSessions/client/Client.ts">get</a>(draftSessionId) -> TrueFoundryGateway.DraftSessionsGetResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Get a draft session by id. Owner-only.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.internal.agents.draftSessions.get("draftSessionId");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**draftSessionId:** `string` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `DraftSessionsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.internal.agents.draftSessions.<a href="/src/api/resources/internal/resources/agents/resources/draftSessions/client/Client.ts">update</a>(draftSessionId, { ...params }) -> TrueFoundryGateway.DraftSessionsUpdateResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Update a draft session's inline spec. Owner-only. An empty body is a valid no-op that refreshes `updated_at`.
</dd>
</dl>
</dd>
</dl>

#### 🔌 Usage

<dl>
<dd>

<dl>
<dd>

```typescript
await client.internal.agents.draftSessions.update("draftSessionId");

```
</dd>
</dl>
</dd>
</dl>

#### ⚙️ Parameters

<dl>
<dd>

<dl>
<dd>

**draftSessionId:** `string` 
    
</dd>
</dl>

<dl>
<dd>

**request:** `TrueFoundryGateway.internal.agents.UpdateDraftSessionRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `DraftSessionsClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

