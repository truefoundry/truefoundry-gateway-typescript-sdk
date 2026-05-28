# Reference
## Agent Responses
<details><summary><code>client.agent.responses.<a href="/src/api/resources/agent/resources/responses/client/Client.ts">create</a>({ ...params }) -> core.Stream&lt;TruefoundryGateway.AgentResponseStreamingOutputEvent&gt;</code></summary>
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
const response = await client.agent.responses.create({
    agent_name: "agent_name"
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

**request:** `TruefoundryGateway.AgentRunInput` 
    
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

<details><summary><code>client.agent.responses.<a href="/src/api/resources/agent/resources/responses/client/Client.ts">cancel</a>({ ...params }) -> TruefoundryGateway.ResponsesCancelResponse</code></summary>
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
await client.agent.responses.cancel({
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

**request:** `TruefoundryGateway.agent.ResponsesCancelRequest` 
    
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

<details><summary><code>client.agent.responses.<a href="/src/api/resources/agent/resources/responses/client/Client.ts">get</a>(responseId) -> TruefoundryGateway.ResponsesGetResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Returns the current state of an agent response.
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
await client.agent.responses.get("responseId");

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

**responseId:** `string` 
    
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

<details><summary><code>client.agent.responses.<a href="/src/api/resources/agent/resources/responses/client/Client.ts">sendMessage</a>({ ...params }) -> TruefoundryGateway.ResponsesSendMessageResponse</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Send approval decisions (allow/deny) to a running agent response awaiting user input.
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
await client.agent.responses.sendMessage({
    response_id: "response_id",
    input: [{
            type: "tool.approval",
            execution_id: "execution_id",
            tool_call_id: "tool_call_id",
            approval: {
                status: "allow"
            }
        }]
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

**request:** `TruefoundryGateway.agent.ResponsesSendMessageRequest` 
    
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

<details><summary><code>client.agent.responses.<a href="/src/api/resources/agent/resources/responses/client/Client.ts">subscribe</a>({ ...params }) -> core.Stream&lt;TruefoundryGateway.InternalAgentResponseStreamingOutputEvent&gt;</code></summary>
<dl>
<dd>

#### 📝 Description

<dl>
<dd>

<dl>
<dd>

Subscribe to a running agent response.
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
const response = await client.agent.responses.subscribe({
    response_id: "response_id"
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

**request:** `TruefoundryGateway.agent.ResponsesSubscribeRequest` 
    
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

