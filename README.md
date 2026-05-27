# truefoundry-gateway-sdk (TypeScript)

> ⚠️ This repository is **auto-generated** by [Fern](https://buildwithfern.com/)
> from [`truefoundry/truefoundry-gateway-fern-config`](https://github.com/truefoundry/truefoundry-gateway-fern-config).
>
> All hand edits will be overwritten on the next SDK release except for the
> paths listed in [`.fernignore`](./.fernignore). To change generated code,
> edit the OpenAPI spec / overrides / generator config in the fern-config
> repo and cut a new release.

`truefoundry-gateway-sdk` is the TypeScript/Node client for the TrueFoundry
Gateway agent API — a stateful, streaming runtime exposed at
`https://gateway.truefoundry.ai/<tenant>/agent/*`.

## Install

```sh
npm install truefoundry-gateway-sdk
# or
pnpm add truefoundry-gateway-sdk
```

## Quickstart

```ts
import { TruefoundryGateway } from 'truefoundry-gateway-sdk';

const client = new TruefoundryGateway({
  baseUrl: 'https://gateway.truefoundry.ai/<tenant>',
  token: process.env.TFY_API_KEY!,
});

const stream = await client.agent.responses.create({
  agent_name: 'my-agent',
  input: [{ role: 'user', content: 'hi' }],
});

for await (const event of stream) {
  console.log(event);
}
```

## Releasing

Releases are cut from
[`truefoundry/truefoundry-gateway-fern-config`](https://github.com/truefoundry/truefoundry-gateway-fern-config)
by pushing a `v*` tag there. The Fern workflow regenerates this repo onto a
`release-v<version>` branch and publishes the package to npm via **OIDC
trusted publishing** in the same job — no `NPM_TOKEN` secret is required on
this repo.
