[**Autonomous Agents Platform API**](../index.md)

***

[Autonomous Agents Platform API](../index.md) / sandbox-providers/src

# sandbox-providers/src

Sandbox Providers Package
=========================

Unified interface for cloud sandbox providers.

## Classes

### DaytonaProvider

Defined in: [packages/sandbox-providers/src/daytona.ts:86](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/daytona.ts#L86)

Daytona sandbox provider implementation.

TODO: Full implementation requires:
1. Daytona SDK/API client
2. Workspace management
3. Git integration
4. SSH/exec capabilities

#### Implements

- [`SandboxProvider`](#sandboxprovider)

#### Constructors

##### Constructor

```ts
new DaytonaProvider(): DaytonaProvider;
```

###### Returns

[`DaytonaProvider`](#daytonaprovider)

#### Properties

##### name

```ts
name: string = 'daytona';
```

Defined in: [packages/sandbox-providers/src/daytona.ts:87](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/daytona.ts#L87)

Provider name identifier

###### Implementation of

[`SandboxProvider`](#sandboxprovider).[`name`](#name-2)

#### Methods

##### create()

```ts
create(config): Promise<Sandbox>;
```

Defined in: [packages/sandbox-providers/src/daytona.ts:91](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/daytona.ts#L91)

Create a new sandbox instance.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config` | [`SandboxConfig`](#sandboxconfig) | Sandbox configuration |

###### Returns

`Promise`\<[`Sandbox`](#sandbox)\>

The created sandbox

###### Implementation of

[`SandboxProvider`](#sandboxprovider).[`create`](#create-4)

##### destroy()

```ts
destroy(id): Promise<void>;
```

Defined in: [packages/sandbox-providers/src/daytona.ts:113](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/daytona.ts#L113)

Destroy a sandbox by ID.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | Sandbox ID |

###### Returns

`Promise`\<`void`\>

###### Implementation of

[`SandboxProvider`](#sandboxprovider).[`destroy`](#destroy-6)

##### get()

```ts
get(id): Promise<Sandbox | null>;
```

Defined in: [packages/sandbox-providers/src/daytona.ts:105](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/daytona.ts#L105)

Get an existing sandbox by ID.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | Sandbox ID |

###### Returns

`Promise`\<[`Sandbox`](#sandbox) \| `null`\>

The sandbox if found, null otherwise

###### Implementation of

[`SandboxProvider`](#sandboxprovider).[`get`](#get-4)

##### list()

```ts
list(): Promise<Sandbox[]>;
```

Defined in: [packages/sandbox-providers/src/daytona.ts:109](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/daytona.ts#L109)

List all active sandboxes.
Note: Not all providers support this operation.

###### Returns

`Promise`\<[`Sandbox`](#sandbox)[]\>

Array of active sandboxes

###### Implementation of

[`SandboxProvider`](#sandboxprovider).[`list`](#list-4)

***

### E2BProvider

Defined in: [packages/sandbox-providers/src/e2b.ts:189](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/e2b.ts#L189)

E2B sandbox provider implementation.

#### Implements

- [`SandboxProvider`](#sandboxprovider)

#### Constructors

##### Constructor

```ts
new E2BProvider(): E2BProvider;
```

###### Returns

[`E2BProvider`](#e2bprovider)

#### Properties

##### name

```ts
name: string = 'e2b';
```

Defined in: [packages/sandbox-providers/src/e2b.ts:190](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/e2b.ts#L190)

Provider name identifier

###### Implementation of

[`SandboxProvider`](#sandboxprovider).[`name`](#name-2)

#### Methods

##### create()

```ts
create(config): Promise<Sandbox>;
```

Defined in: [packages/sandbox-providers/src/e2b.ts:198](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/e2b.ts#L198)

Create a new E2B sandbox.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `config` | [`SandboxConfig`](#sandboxconfig) |

###### Returns

`Promise`\<[`Sandbox`](#sandbox)\>

###### Implementation of

[`SandboxProvider`](#sandboxprovider).[`create`](#create-4)

##### destroy()

```ts
destroy(id): Promise<void>;
```

Defined in: [packages/sandbox-providers/src/e2b.ts:244](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/e2b.ts#L244)

Destroy a sandbox by ID.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

###### Returns

`Promise`\<`void`\>

###### Implementation of

[`SandboxProvider`](#sandboxprovider).[`destroy`](#destroy-6)

##### get()

```ts
get(id): Promise<Sandbox | null>;
```

Defined in: [packages/sandbox-providers/src/e2b.ts:215](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/e2b.ts#L215)

Get an existing sandbox by ID.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

###### Returns

`Promise`\<[`Sandbox`](#sandbox) \| `null`\>

###### Implementation of

[`SandboxProvider`](#sandboxprovider).[`get`](#get-4)

##### list()

```ts
list(): Promise<Sandbox[]>;
```

Defined in: [packages/sandbox-providers/src/e2b.ts:237](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/e2b.ts#L237)

List all active sandboxes.
Note: E2B doesn't have a list API, so we only return locally tracked sandboxes.

###### Returns

`Promise`\<[`Sandbox`](#sandbox)[]\>

###### Implementation of

[`SandboxProvider`](#sandboxprovider).[`list`](#list-4)

## Interfaces

### AgentOutput

Defined in: [packages/sandbox-providers/src/interface.ts:19](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/interface.ts#L19)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="content"></a> `content` | `string` |
| <a id="metadata"></a> `metadata?` | `Record`\<`string`, `unknown`\> |
| <a id="timestamp"></a> `timestamp` | `Date` |
| <a id="type"></a> `type` | `"error"` \| `"text"` \| `"tool_use"` \| `"tool_result"` |

***

### ExecResult

Defined in: [packages/sandbox-providers/src/interface.ts:13](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/interface.ts#L13)

Sandbox Provider Interface
==========================

Common interface for cloud sandbox providers.
Supports E2B, Daytona, Cloudflare, and other sandbox environments.

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="exitcode"></a> `exitCode` | `number` |
| <a id="stderr"></a> `stderr` | `string` |
| <a id="stdout"></a> `stdout` | `string` |

***

### Sandbox

Defined in: [packages/sandbox-providers/src/interface.ts:26](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/interface.ts#L26)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="id"></a> `id` | `string` |
| <a id="status"></a> `status` | `"error"` \| `"creating"` \| `"running"` \| `"stopped"` |

#### Methods

##### destroy()

```ts
destroy(): Promise<void>;
```

Defined in: [packages/sandbox-providers/src/interface.ts:46](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/interface.ts#L46)

Stop and destroy the sandbox

###### Returns

`Promise`\<`void`\>

##### downloadDir()

```ts
downloadDir(path): Promise<Buffer<ArrayBufferLike>>;
```

Defined in: [packages/sandbox-providers/src/interface.ts:43](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/interface.ts#L43)

Download directory as buffer

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

###### Returns

`Promise`\<`Buffer`\<`ArrayBufferLike`\>\>

##### exec()

```ts
exec(command): Promise<ExecResult>;
```

Defined in: [packages/sandbox-providers/src/interface.ts:31](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/interface.ts#L31)

Execute a command in the sandbox

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `command` | `string` |

###### Returns

`Promise`\<[`ExecResult`](#execresult)\>

##### execStream()

```ts
execStream(command): AsyncIterable<string>;
```

Defined in: [packages/sandbox-providers/src/interface.ts:34](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/interface.ts#L34)

Stream command output

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `command` | `string` |

###### Returns

`AsyncIterable`\<`string`\>

##### getHost()

```ts
getHost(port): string;
```

Defined in: [packages/sandbox-providers/src/interface.ts:58](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/interface.ts#L58)

Get the public host/URL for a port exposed in the sandbox.
Use this to access web servers running inside the sandbox.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `port` | `number` | The port number to get the host for |

###### Returns

`string`

The public host address (e.g., "abc123-3000.e2b.dev")

##### isRunning()

```ts
isRunning(): Promise<boolean>;
```

Defined in: [packages/sandbox-providers/src/interface.ts:65](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/interface.ts#L65)

Check if the sandbox is still running/alive.

###### Returns

`Promise`\<`boolean`\>

True if sandbox is running, false otherwise

##### onOutput()

```ts
onOutput(callback): () => void;
```

Defined in: [packages/sandbox-providers/src/interface.ts:49](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/interface.ts#L49)

Subscribe to agent output

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `callback` | (`data`) => `void` |

###### Returns

```ts
(): void;
```

###### Returns

`void`

##### readFile()

```ts
readFile(path): Promise<string>;
```

Defined in: [packages/sandbox-providers/src/interface.ts:40](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/interface.ts#L40)

Read a file from the sandbox

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

###### Returns

`Promise`\<`string`\>

##### setTimeout()

```ts
setTimeout(timeoutMs): Promise<void>;
```

Defined in: [packages/sandbox-providers/src/interface.ts:72](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/interface.ts#L72)

Extend the sandbox timeout.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `timeoutMs` | `number` | New timeout in milliseconds from now |

###### Returns

`Promise`\<`void`\>

##### writeFile()

```ts
writeFile(path, content): Promise<void>;
```

Defined in: [packages/sandbox-providers/src/interface.ts:37](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/interface.ts#L37)

Write a file to the sandbox

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |
| `content` | `string` |

###### Returns

`Promise`\<`void`\>

***

### SandboxConfig

Defined in: [packages/sandbox-providers/src/interface.ts:75](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/interface.ts#L75)

#### Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="env"></a> `env?` | `Record`\<`string`, `string`\> | Environment variables |
| <a id="resources"></a> `resources?` | `object` | Resource limits |
| `resources.cpu?` | `number` | - |
| `resources.disk?` | `string` | - |
| `resources.memory?` | `string` | - |
| <a id="template"></a> `template?` | `string` | Provider-specific template/image |
| <a id="timeout"></a> `timeout?` | `number` | Timeout in seconds |

***

### SandboxProvider

Defined in: [packages/sandbox-providers/src/interface.ts:98](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/interface.ts#L98)

Sandbox provider interface.
Implement this interface to add support for new sandbox providers.

#### Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="name-2"></a> `name` | `string` | Provider name identifier |

#### Methods

##### create()

```ts
create(config): Promise<Sandbox>;
```

Defined in: [packages/sandbox-providers/src/interface.ts:108](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/interface.ts#L108)

Create a new sandbox instance.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config` | [`SandboxConfig`](#sandboxconfig) | Sandbox configuration |

###### Returns

`Promise`\<[`Sandbox`](#sandbox)\>

The created sandbox

##### destroy()

```ts
destroy(id): Promise<void>;
```

Defined in: [packages/sandbox-providers/src/interface.ts:131](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/interface.ts#L131)

Destroy a sandbox by ID.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | Sandbox ID |

###### Returns

`Promise`\<`void`\>

##### get()

```ts
get(id): Promise<Sandbox | null>;
```

Defined in: [packages/sandbox-providers/src/interface.ts:116](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/interface.ts#L116)

Get an existing sandbox by ID.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | Sandbox ID |

###### Returns

`Promise`\<[`Sandbox`](#sandbox) \| `null`\>

The sandbox if found, null otherwise

##### list()

```ts
list(): Promise<Sandbox[]>;
```

Defined in: [packages/sandbox-providers/src/interface.ts:124](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/interface.ts#L124)

List all active sandboxes.
Note: Not all providers support this operation.

###### Returns

`Promise`\<[`Sandbox`](#sandbox)[]\>

Array of active sandboxes

## Type Aliases

### ProviderRegistry

```ts
type ProviderRegistry = Record<string, SandboxProvider>;
```

Defined in: [packages/sandbox-providers/src/interface.ts:137](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/interface.ts#L137)

Provider registry type.

## Variables

### daytonaProvider

```ts
const daytonaProvider: DaytonaProvider;
```

Defined in: [packages/sandbox-providers/src/daytona.ts:125](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/daytona.ts#L125)

Default Daytona provider instance.

***

### e2bProvider

```ts
const e2bProvider: E2BProvider;
```

Defined in: [packages/sandbox-providers/src/e2b.ts:256](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/e2b.ts#L256)

Default E2B provider instance.

## Functions

### createSandbox()

```ts
function createSandbox(providerName, config): Promise<Sandbox>;
```

Defined in: [packages/sandbox-providers/src/interface.ts:187](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/interface.ts#L187)

Create a sandbox using a registered provider.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `providerName` | `string` | Name of the provider to use |
| `config` | [`SandboxConfig`](#sandboxconfig) | Sandbox configuration |

#### Returns

`Promise`\<[`Sandbox`](#sandbox)\>

The created sandbox

***

### getProvider()

```ts
function getProvider(name): SandboxProvider;
```

Defined in: [packages/sandbox-providers/src/interface.ts:160](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/interface.ts#L160)

Get a registered provider by name.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | Provider name |

#### Returns

[`SandboxProvider`](#sandboxprovider)

The provider if found

#### Throws

Error if provider is not registered

***

### getSandbox()

```ts
function getSandbox(id): Promise<Sandbox | null>;
```

Defined in: [packages/sandbox-providers/src/interface.ts:201](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/interface.ts#L201)

Get a sandbox from any registered provider.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | Sandbox ID (may include provider prefix like 'e2b:sandbox-id') |

#### Returns

`Promise`\<[`Sandbox`](#sandbox) \| `null`\>

The sandbox if found

***

### listProviders()

```ts
function listProviders(): string[];
```

Defined in: [packages/sandbox-providers/src/interface.ts:176](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/interface.ts#L176)

List all registered providers.

#### Returns

`string`[]

Array of provider names

***

### registerProvider()

```ts
function registerProvider(provider): void;
```

Defined in: [packages/sandbox-providers/src/interface.ts:149](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/sandbox-providers/src/interface.ts#L149)

Register a sandbox provider.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `provider` | [`SandboxProvider`](#sandboxprovider) | The provider to register |

#### Returns

`void`
