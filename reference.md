# Reference
## Agents Responses
<details><summary><code>client.agents.responses.<a href="/src/api/resources/agents/resources/responses/client/Client.ts">create</a>({ ...params }) -> core.Stream&lt;TruefoundryGateway.AgentResponseStreamingOutputEvent&gt;</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Execute an agent in stateful mode (responses are stored server-side by default). Use Named (`agent_name`) or Inline (`model`) input. Continue a conversation with `previous_response_id`. Responds with a Server-Sent Events stream of `AgentResponseStreamingOutputEvent` objects.
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
const response = await client.agents.responses.create({
    model: "model"
});
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

**request:** `TruefoundryGateway.AgentResponsesBody` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ResponsesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

<details><summary><code>client.agents.responses.<a href="/src/api/resources/agents/resources/responses/client/Client.ts">cancel</a>({ ...params }) -> TruefoundryGateway.ResponsesCancelResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Cancel a running agent response. Requires the `response_id` returned from a prior stateful `/responses` call.
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
await client.agents.responses.cancel({
    response_id: "response_id"
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

**request:** `TruefoundryGateway.agents.ResponsesCancelRequest` 
    
</dd>
</dl>

<dl>
<dd>

**requestOptions:** `ResponsesClient.RequestOptions` 
    
</dd>
</dl>
</dd>
</dl>


</dd>
</dl>
</details>

