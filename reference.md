# Reference
## Private Agents Sessions
<details><summary><code>client.private.agents.sessions.<a href="/src/api/resources/private/resources/agents/resources/sessions/client/Client.ts">list</a>({ ...params }) -> core.Page&lt;TrueFoundryGateway.Session, TrueFoundryGateway.ListSessionsResponse&gt;</code></summary>
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
const pageableResponse = await client.private.agents.sessions.list({
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
let page = await client.private.agents.sessions.list({
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

**request:** `TrueFoundryGateway.private_.agents.ListSessionsRequest` 
    
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

<details><summary><code>client.private.agents.sessions.<a href="/src/api/resources/private/resources/agents/resources/sessions/client/Client.ts">create</a>({ ...params }) -> TrueFoundryGateway.GetSessionResponse</code></summary>
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
await client.private.agents.sessions.create({
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

**request:** `TrueFoundryGateway.private_.agents.CreateSessionRequest` 
    
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

<details><summary><code>client.private.agents.sessions.<a href="/src/api/resources/private/resources/agents/resources/sessions/client/Client.ts">get</a>(sessionId) -> TrueFoundryGateway.GetSessionResponse</code></summary>
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
await client.private.agents.sessions.get("sessionId");

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

**sessionId:** `string` — Session identifier.
    
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

<details><summary><code>client.private.agents.sessions.<a href="/src/api/resources/private/resources/agents/resources/sessions/client/Client.ts">cancel</a>(sessionId, { ...params }) -> TrueFoundryGateway.CancelSessionResponse</code></summary>
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
await client.private.agents.sessions.cancel("01arz3ndektsv4rrffq69g5fav.g");

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

**request:** `TrueFoundryGateway.private_.agents.CancelSessionRequest` 
    
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

<details><summary><code>client.private.agents.sessions.<a href="/src/api/resources/private/resources/agents/resources/sessions/client/Client.ts">listTurns</a>(sessionId, { ...params }) -> core.Page&lt;TrueFoundryGateway.Turn, TrueFoundryGateway.ListTurnsResponse&gt;</code></summary>
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
const pageableResponse = await client.private.agents.sessions.listTurns("01arz3ndektsv4rrffq69g5fav.g", {
    pageToken: "page_token",
    limit: 1
});
for await (const item of pageableResponse) {
    console.log(item);
}

// Or you can manually iterate page-by-page
let page = await client.private.agents.sessions.listTurns("01arz3ndektsv4rrffq69g5fav.g", {
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

**request:** `TrueFoundryGateway.private_.agents.ListTurnsSessionsRequest` 
    
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

<details><summary><code>client.private.agents.sessions.<a href="/src/api/resources/private/resources/agents/resources/sessions/client/Client.ts">createTurn</a>(sessionId, { ...params }) -> core.Stream&lt;TrueFoundryGateway.TurnStreamingEvent&gt;</code></summary>
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
const response = await client.private.agents.sessions.createTurn("01arz3ndektsv4rrffq69g5fav.g");
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

**request:** `TrueFoundryGateway.private_.agents.CreateTurnRequest` 
    
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

<details><summary><code>client.private.agents.sessions.<a href="/src/api/resources/private/resources/agents/resources/sessions/client/Client.ts">getTurn</a>(sessionId, turnId) -> TrueFoundryGateway.GetTurnResponse</code></summary>
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
await client.private.agents.sessions.getTurn("01arz3ndektsv4rrffq69g5fav.g", "01arz3ndektsv4rrffq69g5fav.g.ab12cd");

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

<details><summary><code>client.private.agents.sessions.<a href="/src/api/resources/private/resources/agents/resources/sessions/client/Client.ts">subscribeToTurn</a>(sessionId, turnId, { ...params }) -> core.Stream&lt;TrueFoundryGateway.TurnStreamingEvent&gt;</code></summary>
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
const response = await client.private.agents.sessions.subscribeToTurn("01arz3ndektsv4rrffq69g5fav.g", "01arz3ndektsv4rrffq69g5fav.g.ab12cd");
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

**request:** `TrueFoundryGateway.private_.agents.SubscribeTurnRequest` 
    
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

<details><summary><code>client.private.agents.sessions.<a href="/src/api/resources/private/resources/agents/resources/sessions/client/Client.ts">listTurnEvents</a>(sessionId, turnId, { ...params }) -> core.Page&lt;TrueFoundryGateway.TurnEvent, TrueFoundryGateway.ListEventsResponse&gt;</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Paginated list of content turn events from the Redis events stream (model.message, tool.call, …). `turn.created` and `turn.done` are stored in the stream but excluded from this endpoint — use session list_events for lifecycle. Only available after the turn has reached a terminal state; use subscribe for running turns.
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
const pageableResponse = await client.private.agents.sessions.listTurnEvents("01arz3ndektsv4rrffq69g5fav.g", "01arz3ndektsv4rrffq69g5fav.g.ab12cd", {
    pageToken: "page_token",
    limit: 1,
    order: "asc"
});
for await (const item of pageableResponse) {
    console.log(item);
}

// Or you can manually iterate page-by-page
let page = await client.private.agents.sessions.listTurnEvents("01arz3ndektsv4rrffq69g5fav.g", "01arz3ndektsv4rrffq69g5fav.g.ab12cd", {
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

**request:** `TrueFoundryGateway.private_.agents.ListTurnEventsSessionsRequest` 
    
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

<details><summary><code>client.private.agents.sessions.<a href="/src/api/resources/private/resources/agents/resources/sessions/client/Client.ts">listEvents</a>(sessionId, { ...params }) -> core.Page&lt;TrueFoundryGateway.SessionEventItem, TrueFoundryGateway.ListSessionEventsResponse&gt;</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

List session events as `{ turn_id, event }` across a turn hierarchy (newest first). Each turn contributes turn.created, content events (model.message, tool.call, …), and turn.done; streaming deltas are not included. `last_turn_id` (initial load only) sets the newest turn in the window plus its ancestors; omit to use the session last turn. If that turn is still running, it is excluded — listing anchors on its parent so persisted events are returned without overlapping the live stream; subscribe to the running turn for live events. An empty `data` array is returned when the anchor is a running first turn with no parent. Use `page_token` to paginate backward toward older events; chains longer than the stored ancestor window are walked via spill to the session root.
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
const pageableResponse = await client.private.agents.sessions.listEvents("01arz3ndektsv4rrffq69g5fav.g", {
    pageToken: "page_token",
    lastTurnId: "last_turn_id",
    limit: 1
});
for await (const item of pageableResponse) {
    console.log(item);
}

// Or you can manually iterate page-by-page
let page = await client.private.agents.sessions.listEvents("01arz3ndektsv4rrffq69g5fav.g", {
    pageToken: "page_token",
    lastTurnId: "last_turn_id",
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

**request:** `TrueFoundryGateway.private_.agents.ListEventsSessionsRequest` 
    
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

## Private Agents Private
<details><summary><code>client.private.agents.private.<a href="/src/api/resources/private/resources/agents/resources/private/client/Client.ts">listOwnedSessions</a>({ ...params }) -> core.Page&lt;TrueFoundryGateway.ListOwnedSessionsResponseDataItem, TrueFoundryGateway.ListOwnedSessionsResponse&gt;</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

List all sessions owned by the caller, spanning both saved sessions and drafts (newest first by default), keyset-paginated. Optionally filter by `agent_name`. Pass `page_token` to fetch the next page, keeping the other query params constant.
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
const pageableResponse = await client.private.agents.private.listOwnedSessions({
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
let page = await client.private.agents.private.listOwnedSessions({
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

**request:** `TrueFoundryGateway.private_.agents.ListOwnedSessionsPrivateRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `PrivateClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.private.agents.private.<a href="/src/api/resources/private/resources/agents/resources/private/client/Client.ts">downloadSandboxFile</a>(sandboxId, { ...params }) -> core.BinaryResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Download a file produced by an agent inside a sandbox.
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
await client.private.agents.private.downloadSandboxFile("sandboxId", {
    path: "x"
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

**sandboxId:** `string` — The sandbox containing the file.
    
</dd>
</dl>

<dl>
<dd>

**request:** `TrueFoundryGateway.private_.agents.DownloadSandboxFilePrivateRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `PrivateClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

## Private Agents Private DraftSessions
<details><summary><code>client.private.agents.private.draftSessions.<a href="/src/api/resources/private/resources/agents/resources/private/resources/draftSessions/client/Client.ts">list</a>({ ...params }) -> core.Page&lt;TrueFoundryGateway.DraftSession, TrueFoundryGateway.ListDraftSessionsResponse&gt;</code></summary>
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
const pageableResponse = await client.private.agents.private.draftSessions.list({
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
let page = await client.private.agents.private.draftSessions.list({
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

**request:** `TrueFoundryGateway.private_.agents.private_.ListDraftSessionsRequest` 
    
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

<details><summary><code>client.private.agents.private.draftSessions.<a href="/src/api/resources/private/resources/agents/resources/private/resources/draftSessions/client/Client.ts">create</a>({ ...params }) -> TrueFoundryGateway.GetDraftSessionResponse</code></summary>
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
await client.private.agents.private.draftSessions.create({
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

**request:** `TrueFoundryGateway.private_.agents.private_.CreateDraftSessionRequest` 
    
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

<details><summary><code>client.private.agents.private.draftSessions.<a href="/src/api/resources/private/resources/agents/resources/private/resources/draftSessions/client/Client.ts">get</a>(draftSessionId) -> TrueFoundryGateway.GetDraftSessionResponse</code></summary>
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
await client.private.agents.private.draftSessions.get("draftSessionId");

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

**draftSessionId:** `string` — Draft session identifier.
    
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

<details><summary><code>client.private.agents.private.draftSessions.<a href="/src/api/resources/private/resources/agents/resources/private/resources/draftSessions/client/Client.ts">update</a>(draftSessionId, { ...params }) -> TrueFoundryGateway.GetDraftSessionResponse</code></summary>
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
await client.private.agents.private.draftSessions.update("draftSessionId");

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

**draftSessionId:** `string` — Draft session identifier.
    
</dd>
</dl>

<dl>
<dd>

**request:** `TrueFoundryGateway.private_.agents.private_.UpdateDraftSessionRequest` 
    
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

