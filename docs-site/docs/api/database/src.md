[**Autonomous Agents Platform API**](../index.md)

***

[Autonomous Agents Platform API](../index.md) / database/src

# database/src

Database Package
================

Prisma client and data access helpers for the autonomous agents platform.

## Interfaces

### ChatMessage

Defined in: [packages/database/src/helpers/chats.ts:9](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/chats.ts#L9)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="content"></a> `content` | `string` |
| <a id="id"></a> `id` | `string` |
| <a id="role"></a> `role` | `"user"` \| `"assistant"` |
| <a id="timestamp"></a> `timestamp` | `string` |

***

### CreateAppSpecInput

Defined in: [packages/database/src/helpers/appspecs.ts:11](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/appspecs.ts#L11)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="appdescription"></a> `appDescription?` | `string` |
| <a id="chatid"></a> `chatId?` | `string` |
| <a id="content-1"></a> `content` | `string` |
| <a id="format"></a> `format?` | [`AppSpecFormat`](#appspecformat) |
| <a id="name"></a> `name` | `string` |
| <a id="projectid"></a> `projectId?` | `string` |
| <a id="userid"></a> `userId` | `string` |

***

### CreateBuildEventInput

Defined in: [packages/database/src/helpers/events.ts:11](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/events.ts#L11)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="buildid"></a> `buildId` | `string` |
| <a id="data"></a> `data` | `Record`\<`string`, `unknown`\> |
| <a id="type"></a> `type` | `string` |

***

### CreateBuildInput

Defined in: [packages/database/src/helpers/builds.ts:11](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/builds.ts#L11)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="appspec"></a> `appSpec` | `string` |
| <a id="appspecid"></a> `appSpecId?` | `string` |
| <a id="complexityinferred"></a> `complexityInferred?` | `boolean` |
| <a id="complexitytier"></a> `complexityTier?` | [`ComplexityTier`](#complexitytier-1) |
| <a id="harnessid"></a> `harnessId?` | `string` |
| <a id="projectid-1"></a> `projectId?` | `string` |
| <a id="reviewgatesenabled"></a> `reviewGatesEnabled?` | `boolean` |
| <a id="sandboxprovider"></a> `sandboxProvider?` | `string` |
| <a id="targetfeaturecount"></a> `targetFeatureCount?` | `number` |
| <a id="userid-1"></a> `userId` | `string` |

***

### CreateBuildLogInput

Defined in: [packages/database/src/helpers/builds.ts:100](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/builds.ts#L100)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="buildid-1"></a> `buildId` | `string` |
| <a id="level"></a> `level` | `string` |
| <a id="message"></a> `message` | `string` |
| <a id="metadata"></a> `metadata?` | `object` |

***

### CreateChatSessionInput

Defined in: [packages/database/src/helpers/chats.ts:16](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/chats.ts#L16)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="messages"></a> `messages?` | [`ChatMessage`](#chatmessage)[] |
| <a id="projectid-2"></a> `projectId?` | `string` |
| <a id="title"></a> `title?` | `string` |
| <a id="userid-2"></a> `userId` | `string` |

***

### CreateProjectInput

Defined in: [packages/database/src/helpers/projects.ts:9](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/projects.ts#L9)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="description"></a> `description?` | `string` |
| <a id="name-1"></a> `name` | `string` |
| <a id="userid-3"></a> `userId` | `string` |

***

### CreateUserInput

Defined in: [packages/database/src/helpers/users.ts:9](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/users.ts#L9)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="clerkid"></a> `clerkId` | `string` |
| <a id="email"></a> `email` | `string` |
| <a id="name-2"></a> `name?` | `string` |

***

### ListAppSpecsOptions

Defined in: [packages/database/src/helpers/appspecs.ts:29](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/appspecs.ts#L29)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="limit"></a> `limit?` | `number` |
| <a id="offset"></a> `offset?` | `number` |
| <a id="projectid-3"></a> `projectId?` | `string` |
| <a id="userid-4"></a> `userId` | `string` |

***

### ListBuildEventsOptions

Defined in: [packages/database/src/helpers/events.ts:17](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/events.ts#L17)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="after"></a> `after?` | `Date` |
| <a id="buildid-2"></a> `buildId` | `string` |
| <a id="limit-1"></a> `limit?` | `number` |
| <a id="offset-1"></a> `offset?` | `number` |
| <a id="types"></a> `types?` | `string`[] |

***

### ListBuildsOptions

Defined in: [packages/database/src/helpers/builds.ts:92](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/builds.ts#L92)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="limit-2"></a> `limit?` | `number` |
| <a id="offset-2"></a> `offset?` | `number` |
| <a id="projectid-4"></a> `projectId?` | `string` |
| <a id="status"></a> `status?` | `BuildStatus` |
| <a id="userid-5"></a> `userId?` | `string` |

***

### ListChatSessionsOptions

Defined in: [packages/database/src/helpers/chats.ts:29](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/chats.ts#L29)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="limit-3"></a> `limit?` | `number` |
| <a id="offset-3"></a> `offset?` | `number` |
| <a id="projectid-5"></a> `projectId?` | `string` |
| <a id="userid-6"></a> `userId` | `string` |

***

### ListProjectsOptions

Defined in: [packages/database/src/helpers/projects.ts:20](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/projects.ts#L20)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="limit-4"></a> `limit?` | `number` |
| <a id="offset-4"></a> `offset?` | `number` |
| <a id="userid-7"></a> `userId` | `string` |

***

### UpdateAppSpecInput

Defined in: [packages/database/src/helpers/appspecs.ts:21](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/appspecs.ts#L21)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="appdescription-1"></a> `appDescription?` | `string` \| `null` |
| <a id="content-2"></a> `content?` | `string` |
| <a id="format-1"></a> `format?` | [`AppSpecFormat`](#appspecformat) |
| <a id="name-3"></a> `name?` | `string` |
| <a id="projectid-6"></a> `projectId?` | `string` \| `null` |

***

### UpdateBuildInput

Defined in: [packages/database/src/helpers/builds.ts:69](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/builds.ts#L69)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="artifactkey"></a> `artifactKey?` | `string` |
| <a id="checkpointdata"></a> `checkpointData?` | `Record`\<`string`, `unknown`\> |
| <a id="completedat"></a> `completedAt?` | `Date` |
| <a id="conversationhistory"></a> `conversationHistory?` | `Record`\<`string`, `unknown`\>[] |
| <a id="designapprovedat"></a> `designApprovedAt?` | `Date` |
| <a id="featuresapprovedat"></a> `featuresApprovedAt?` | `Date` |
| <a id="outputurl"></a> `outputUrl?` | `string` |
| <a id="pausedat"></a> `pausedAt?` | `Date` \| `null` |
| <a id="pausereason"></a> `pauseReason?` | `string` \| `null` |
| <a id="previewexpiresat"></a> `previewExpiresAt?` | `Date` |
| <a id="previewport"></a> `previewPort?` | `number` |
| <a id="previewstartedat"></a> `previewStartedAt?` | `Date` |
| <a id="previewstatus"></a> `previewStatus?` | `string` |
| <a id="progress"></a> `progress?` | `Record`\<`string`, `unknown`\> |
| <a id="sandboxid"></a> `sandboxId?` | `string` |
| <a id="startedat"></a> `startedAt?` | `Date` |
| <a id="status-1"></a> `status?` | `BuildStatus` |

***

### UpdateChatSessionInput

Defined in: [packages/database/src/helpers/chats.ts:23](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/chats.ts#L23)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="messages-1"></a> `messages?` | [`ChatMessage`](#chatmessage)[] |
| <a id="projectid-7"></a> `projectId?` | `string` \| `null` |
| <a id="title-1"></a> `title?` | `string` |

***

### UpdateProjectInput

Defined in: [packages/database/src/helpers/projects.ts:15](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/projects.ts#L15)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="description-1"></a> `description?` | `string` |
| <a id="name-4"></a> `name?` | `string` |

***

### UpdateUserInput

Defined in: [packages/database/src/helpers/users.ts:15](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/users.ts#L15)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="email-1"></a> `email?` | `string` |
| <a id="name-5"></a> `name?` | `string` |

## Type Aliases

### AppSpecFormat

```ts
type AppSpecFormat = "xml" | "markdown";
```

Defined in: [packages/database/src/helpers/appspecs.ts:9](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/appspecs.ts#L9)

***

### ComplexityTier

```ts
type ComplexityTier = "simple" | "standard" | "production";
```

Defined in: [packages/database/src/helpers/builds.ts:9](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/builds.ts#L9)

## Variables

### prisma

```ts
const prisma: PrismaClient<PrismaClientOptions, never, DefaultArgs>;
```

Defined in: [packages/database/src/client.ts:21](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/client.ts#L21)

Singleton Prisma client instance.
Uses global variable to prevent multiple instances in development.

## Functions

### completeBuild()

```ts
function completeBuild(
   id, 
   status, 
   options?): Promise<{
}>;
```

Defined in: [packages/database/src/helpers/builds.ts:230](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/builds.ts#L230)

Complete a build (update status and completedAt).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `status` | `"COMPLETED"` \| `"FAILED"` \| `"CANCELLED"` |
| `options?` | \{ `artifactKey?`: `string`; `outputUrl?`: `string`; \} |
| `options.artifactKey?` | `string` |
| `options.outputUrl?` | `string` |

#### Returns

`Promise`\<\{
\}\>

***

### countAppSpecs()

```ts
function countAppSpecs(userId, projectId?): Promise<number>;
```

Defined in: [packages/database/src/helpers/appspecs.ts:112](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/appspecs.ts#L112)

Count app specs for a user.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `userId` | `string` |
| `projectId?` | `string` |

#### Returns

`Promise`\<`number`\>

***

### countBuildEvents()

```ts
function countBuildEvents(buildId, types?): Promise<number>;
```

Defined in: [packages/database/src/helpers/events.ts:99](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/events.ts#L99)

Count events for a build with optional type filter.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `buildId` | `string` |
| `types?` | `string`[] |

#### Returns

`Promise`\<`number`\>

***

### countBuilds()

```ts
function countBuilds(options): Promise<number>;
```

Defined in: [packages/database/src/helpers/builds.ts:180](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/builds.ts#L180)

Count builds with filters.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | `Omit`\<[`ListBuildsOptions`](#listbuildsoptions), `"limit"` \| `"offset"`\> |

#### Returns

`Promise`\<`number`\>

***

### countChatSessions()

```ts
function countChatSessions(userId, projectId?): Promise<number>;
```

Defined in: [packages/database/src/helpers/chats.ts:109](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/chats.ts#L109)

Count chat sessions for a user.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `userId` | `string` |
| `projectId?` | `string` |

#### Returns

`Promise`\<`number`\>

***

### countProjects()

```ts
function countProjects(userId): Promise<number>;
```

Defined in: [packages/database/src/helpers/projects.ts:76](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/projects.ts#L76)

Count projects for a user.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `userId` | `string` |

#### Returns

`Promise`\<`number`\>

***

### createAppSpec()

```ts
function createAppSpec(input): Promise<{
}>;
```

Defined in: [packages/database/src/helpers/appspecs.ts:43](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/appspecs.ts#L43)

Create a new app spec.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`CreateAppSpecInput`](#createappspecinput) |

#### Returns

`Promise`\<\{
\}\>

***

### createBuild()

```ts
function createBuild(input): Promise<{
}>;
```

Defined in: [packages/database/src/helpers/builds.ts:114](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/builds.ts#L114)

Create a new build.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`CreateBuildInput`](#createbuildinput) |

#### Returns

`Promise`\<\{
\}\>

***

### createBuildEvent()

```ts
function createBuildEvent(input): Promise<{
}>;
```

Defined in: [packages/database/src/helpers/events.ts:32](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/events.ts#L32)

Create a single build event.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`CreateBuildEventInput`](#createbuildeventinput) |

#### Returns

`Promise`\<\{
\}\>

***

### createBuildEventsBatch()

```ts
function createBuildEventsBatch(events): Promise<{
  count: number;
}>;
```

Defined in: [packages/database/src/helpers/events.ts:46](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/events.ts#L46)

Create multiple build events in a batch.
Returns the count of created events.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `events` | [`CreateBuildEventInput`](#createbuildeventinput)[] |

#### Returns

`Promise`\<\{
  `count`: `number`;
\}\>

***

### createBuildLog()

```ts
function createBuildLog(input): Promise<{
}>;
```

Defined in: [packages/database/src/helpers/builds.ts:305](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/builds.ts#L305)

Create a build log entry.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`CreateBuildLogInput`](#createbuildloginput) |

#### Returns

`Promise`\<\{
\}\>

***

### createBuildLogs()

```ts
function createBuildLogs(logs): Promise<{
  count: number;
}>;
```

Defined in: [packages/database/src/helpers/builds.ts:314](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/builds.ts#L314)

Create multiple build log entries.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `logs` | [`CreateBuildLogInput`](#createbuildloginput)[] |

#### Returns

`Promise`\<\{
  `count`: `number`;
\}\>

***

### createChatSession()

```ts
function createChatSession(input): Promise<{
}>;
```

Defined in: [packages/database/src/helpers/chats.ts:43](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/chats.ts#L43)

Create a new chat session.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`CreateChatSessionInput`](#createchatsessioninput) |

#### Returns

`Promise`\<\{
\}\>

***

### createProject()

```ts
function createProject(input): Promise<{
}>;
```

Defined in: [packages/database/src/helpers/projects.ts:29](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/projects.ts#L29)

Create a new project.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`CreateProjectInput`](#createprojectinput) |

#### Returns

`Promise`\<\{
\}\>

***

### createUser()

```ts
function createUser(input): Promise<{
}>;
```

Defined in: [packages/database/src/helpers/users.ts:23](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/users.ts#L23)

Create a new user.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`CreateUserInput`](#createuserinput) |

#### Returns

`Promise`\<\{
\}\>

***

### deleteAppSpec()

```ts
function deleteAppSpec(id): Promise<{
}>;
```

Defined in: [packages/database/src/helpers/appspecs.ts:140](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/appspecs.ts#L140)

Delete an app spec.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\<\{
\}\>

***

### deleteBuild()

```ts
function deleteBuild(id): Promise<{
}>;
```

Defined in: [packages/database/src/helpers/builds.ts:207](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/builds.ts#L207)

Delete a build.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\<\{
\}\>

***

### deleteBuildEvents()

```ts
function deleteBuildEvents(buildId): Promise<{
  count: number;
}>;
```

Defined in: [packages/database/src/helpers/events.ts:114](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/events.ts#L114)

Delete all events for a build.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `buildId` | `string` |

#### Returns

`Promise`\<\{
  `count`: `number`;
\}\>

***

### deleteBuildLogs()

```ts
function deleteBuildLogs(buildId): Promise<{
  count: number;
}>;
```

Defined in: [packages/database/src/helpers/builds.ts:342](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/builds.ts#L342)

Delete all logs for a build.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `buildId` | `string` |

#### Returns

`Promise`\<\{
  `count`: `number`;
\}\>

***

### deleteChatSession()

```ts
function deleteChatSession(id): Promise<{
}>;
```

Defined in: [packages/database/src/helpers/chats.ts:149](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/chats.ts#L149)

Delete a chat session.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\<\{
\}\>

***

### deleteProject()

```ts
function deleteProject(id): Promise<{
}>;
```

Defined in: [packages/database/src/helpers/projects.ts:95](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/projects.ts#L95)

Delete a project.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\<\{
\}\>

***

### deleteUser()

```ts
function deleteUser(id): Promise<{
}>;
```

Defined in: [packages/database/src/helpers/users.ts:69](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/users.ts#L69)

Delete a user.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\<\{
\}\>

***

### extractAppName()

```ts
function extractAppName(content): string;
```

Defined in: [packages/database/src/helpers/appspecs.ts:150](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/appspecs.ts#L150)

Extract app name from spec content.
Supports both XML (\<project_name\>) and Markdown (# Title) formats.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `content` | `string` |

#### Returns

`string`

***

### extractComplexityFromSpec()

```ts
function extractComplexityFromSpec(content): 
  | {
  targetFeatures: number;
  tier: "production" | "simple" | "standard";
}
  | null;
```

Defined in: [packages/database/src/helpers/appspecs.ts:169](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/appspecs.ts#L169)

Extract complexity tier from XML spec content.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `content` | `string` |

#### Returns

  \| \{
  `targetFeatures`: `number`;
  `tier`: `"production"` \| `"simple"` \| `"standard"`;
\}
  \| `null`

***

### generateChatTitle()

```ts
function generateChatTitle(messages): string;
```

Defined in: [packages/database/src/helpers/chats.ts:158](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/chats.ts#L158)

Generate a title for a chat based on first user message.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `messages` | [`ChatMessage`](#chatmessage)[] |

#### Returns

`string`

***

### getAppSpecByChatId()

```ts
function getAppSpecByChatId(chatId): Promise<
  | {
}
| null>;
```

Defined in: [packages/database/src/helpers/appspecs.ts:69](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/appspecs.ts#L69)

Get an app spec by chat ID.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `chatId` | `string` |

#### Returns

`Promise`\<
  \| \{
\}
  \| `null`\>

***

### getAppSpecById()

```ts
function getAppSpecById(id): Promise<
  | {
}
| null>;
```

Defined in: [packages/database/src/helpers/appspecs.ts:60](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/appspecs.ts#L60)

Get an app spec by ID.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\<
  \| \{
\}
  \| `null`\>

***

### getAppSpecWithRelations()

```ts
function getAppSpecWithRelations(id): Promise<object & object | null>;
```

Defined in: [packages/database/src/helpers/appspecs.ts:78](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/appspecs.ts#L78)

Get an app spec with related data.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\<`object` & `object` \| `null`\>

***

### getBuildById()

```ts
function getBuildById(id): Promise<
  | {
}
| null>;
```

Defined in: [packages/database/src/helpers/builds.ts:137](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/builds.ts#L137)

Get a build by ID.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\<
  \| \{
\}
  \| `null`\>

***

### getBuildEvents()

```ts
function getBuildEvents(options): Promise<object[]>;
```

Defined in: [packages/database/src/helpers/events.ts:61](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/events.ts#L61)

Get events for a build with optional filtering.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`ListBuildEventsOptions`](#listbuildeventsoptions) |

#### Returns

`Promise`\<`object`[]\>

***

### getBuildEventsByType()

```ts
function getBuildEventsByType(
   buildId, 
   type, 
limit?): Promise<object[]>;
```

Defined in: [packages/database/src/helpers/events.ts:81](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/events.ts#L81)

Get events for a build by type.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `buildId` | `string` |
| `type` | `string` |
| `limit?` | `number` |

#### Returns

`Promise`\<`object`[]\>

***

### getBuildEventTypeSummary()

```ts
function getBuildEventTypeSummary(buildId): Promise<object[]>;
```

Defined in: [packages/database/src/helpers/events.ts:140](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/events.ts#L140)

Get event type summary for a build.
Returns counts grouped by event type.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `buildId` | `string` |

#### Returns

`Promise`\<`object`[]\>

***

### getBuildLogs()

```ts
function getBuildLogs(buildId, options?): Promise<object[]>;
```

Defined in: [packages/database/src/helpers/builds.ts:323](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/builds.ts#L323)

Get logs for a build.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `buildId` | `string` |
| `options?` | \{ `after?`: `Date`; `limit?`: `number`; \} |
| `options.after?` | `Date` |
| `options.limit?` | `number` |

#### Returns

`Promise`\<`object`[]\>

***

### getBuildWithLogs()

```ts
function getBuildWithLogs(id, logLimit): Promise<object & object | null>;
```

Defined in: [packages/database/src/helpers/builds.ts:146](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/builds.ts#L146)

Get a build with logs.

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `id` | `string` | `undefined` |
| `logLimit` | `number` | `100` |

#### Returns

`Promise`\<`object` & `object` \| `null`\>

***

### getChatSessionById()

```ts
function getChatSessionById(id): Promise<
  | {
}
| null>;
```

Defined in: [packages/database/src/helpers/chats.ts:58](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/chats.ts#L58)

Get a chat session by ID.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\<
  \| \{
\}
  \| `null`\>

***

### getChatSessionWithAppSpec()

```ts
function getChatSessionWithAppSpec(id): Promise<object & object | null>;
```

Defined in: [packages/database/src/helpers/chats.ts:80](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/chats.ts#L80)

Get a chat session with its linked appSpec.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\<`object` & `object` \| `null`\>

***

### getChatSessionWithRelations()

```ts
function getChatSessionWithRelations(id): Promise<object & object | null>;
```

Defined in: [packages/database/src/helpers/chats.ts:67](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/chats.ts#L67)

Get a chat session with related data.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\<`object` & `object` \| `null`\>

***

### getDefaultFeatureCount()

```ts
function getDefaultFeatureCount(tier): number;
```

Defined in: [packages/database/src/helpers/builds.ts:29](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/builds.ts#L29)

Get the default feature count for a complexity tier.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tier` | [`ComplexityTier`](#complexitytier-1) |

#### Returns

`number`

***

### getLatestBuildEvent()

```ts
function getLatestBuildEvent(buildId, type?): Promise<
  | {
}
| null>;
```

Defined in: [packages/database/src/helpers/events.ts:123](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/events.ts#L123)

Get the latest event of a specific type for a build.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `buildId` | `string` |
| `type?` | `string` |

#### Returns

`Promise`\<
  \| \{
\}
  \| `null`\>

***

### getOrCreateUser()

```ts
function getOrCreateUser(input): Promise<{
}>;
```

Defined in: [packages/database/src/helpers/users.ts:78](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/users.ts#L78)

Get or create a user by Clerk ID.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`CreateUserInput`](#createuserinput) |

#### Returns

`Promise`\<\{
\}\>

***

### getProjectById()

```ts
function getProjectById(id): Promise<
  | {
}
| null>;
```

Defined in: [packages/database/src/helpers/projects.ts:38](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/projects.ts#L38)

Get a project by ID.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\<
  \| \{
\}
  \| `null`\>

***

### getProjectWithBuilds()

```ts
function getProjectWithBuilds(id): Promise<object & object | null>;
```

Defined in: [packages/database/src/helpers/projects.ts:47](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/projects.ts#L47)

Get a project by ID with builds.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\<`object` & `object` \| `null`\>

***

### getTierDetails()

```ts
function getTierDetails(tier): 
  | {
  buildTime: string;
  description: string;
  featureRange: string;
  name: string;
}
  | {
  buildTime: string;
  description: string;
  featureRange: string;
  name: string;
}
  | {
  buildTime: string;
  description: string;
  featureRange: string;
  name: string;
};
```

Defined in: [packages/database/src/helpers/builds.ts:45](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/builds.ts#L45)

Get tier details for UI display.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tier` | [`ComplexityTier`](#complexitytier-1) |

#### Returns

  \| \{
  `buildTime`: `string`;
  `description`: `string`;
  `featureRange`: `string`;
  `name`: `string`;
\}
  \| \{
  `buildTime`: `string`;
  `description`: `string`;
  `featureRange`: `string`;
  `name`: `string`;
\}
  \| \{
  `buildTime`: `string`;
  `description`: `string`;
  `featureRange`: `string`;
  `name`: `string`;
\}

***

### getUserByClerkId()

```ts
function getUserByClerkId(clerkId): Promise<
  | {
}
| null>;
```

Defined in: [packages/database/src/helpers/users.ts:41](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/users.ts#L41)

Get a user by Clerk ID.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `clerkId` | `string` |

#### Returns

`Promise`\<
  \| \{
\}
  \| `null`\>

***

### getUserByEmail()

```ts
function getUserByEmail(email): Promise<
  | {
}
| null>;
```

Defined in: [packages/database/src/helpers/users.ts:50](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/users.ts#L50)

Get a user by email.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `email` | `string` |

#### Returns

`Promise`\<
  \| \{
\}
  \| `null`\>

***

### getUserById()

```ts
function getUserById(id): Promise<
  | {
}
| null>;
```

Defined in: [packages/database/src/helpers/users.ts:32](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/users.ts#L32)

Get a user by ID.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\<
  \| \{
\}
  \| `null`\>

***

### listAppSpecs()

```ts
function listAppSpecs(options): Promise<object[]>;
```

Defined in: [packages/database/src/helpers/appspecs.ts:95](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/appspecs.ts#L95)

List app specs for a user.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`ListAppSpecsOptions`](#listappspecsoptions) |

#### Returns

`Promise`\<`object`[]\>

***

### listBuilds()

```ts
function listBuilds(options): Promise<object[]>;
```

Defined in: [packages/database/src/helpers/builds.ts:162](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/builds.ts#L162)

List builds with filters.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`ListBuildsOptions`](#listbuildsoptions) |

#### Returns

`Promise`\<`object`[]\>

***

### listChatSessions()

```ts
function listChatSessions(options): Promise<object[]>;
```

Defined in: [packages/database/src/helpers/chats.ts:92](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/chats.ts#L92)

List chat sessions for a user.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`ListChatSessionsOptions`](#listchatsessionsoptions) |

#### Returns

`Promise`\<`object`[]\>

***

### listProjects()

```ts
function listProjects(options): Promise<object[]>;
```

Defined in: [packages/database/src/helpers/projects.ts:62](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/projects.ts#L62)

List projects for a user.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`ListProjectsOptions`](#listprojectsoptions) |

#### Returns

`Promise`\<`object`[]\>

***

### pauseBuild()

```ts
function pauseBuild(id, options): Promise<{
}>;
```

Defined in: [packages/database/src/helpers/builds.ts:249](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/builds.ts#L249)

Pause a build (save checkpoint and mark as paused).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `options` | \{ `artifactKey?`: `string`; `checkpointData?`: `object`; `conversationHistory?`: `object`; `reason?`: `string`; \} |
| `options.artifactKey?` | `string` |
| `options.checkpointData?` | `object` |
| `options.conversationHistory?` | `object` |
| `options.reason?` | `string` |

#### Returns

`Promise`\<\{
\}\>

***

### resumeBuild()

```ts
function resumeBuild(id): Promise<{
}>;
```

Defined in: [packages/database/src/helpers/builds.ts:274](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/builds.ts#L274)

Resume a paused build (clear pause state and mark as running).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\<\{
\}\>

***

### startBuild()

```ts
function startBuild(id, sandboxId): Promise<{
}>;
```

Defined in: [packages/database/src/helpers/builds.ts:216](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/builds.ts#L216)

Start a build (update status and startedAt).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `sandboxId` | `string` |

#### Returns

`Promise`\<\{
\}\>

***

### updateAppSpec()

```ts
function updateAppSpec(id, input): Promise<{
}>;
```

Defined in: [packages/database/src/helpers/appspecs.ts:124](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/appspecs.ts#L124)

Update an app spec.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `input` | [`UpdateAppSpecInput`](#updateappspecinput) |

#### Returns

`Promise`\<\{
\}\>

***

### updateBuild()

```ts
function updateBuild(id, input): Promise<{
}>;
```

Defined in: [packages/database/src/helpers/builds.ts:195](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/builds.ts#L195)

Update a build.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `input` | [`UpdateBuildInput`](#updatebuildinput) |

#### Returns

`Promise`\<\{
\}\>

***

### updateBuildProgress()

```ts
function updateBuildProgress(id, progress): Promise<{
}>;
```

Defined in: [packages/database/src/helpers/builds.ts:288](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/builds.ts#L288)

Update build progress.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `progress` | `object` |

#### Returns

`Promise`\<\{
\}\>

***

### updateChatSession()

```ts
function updateChatSession(id, input): Promise<{
}>;
```

Defined in: [packages/database/src/helpers/chats.ts:121](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/chats.ts#L121)

Update a chat session.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `input` | [`UpdateChatSessionInput`](#updatechatsessioninput) |

#### Returns

`Promise`\<\{
\}\>

***

### updateProject()

```ts
function updateProject(id, input): Promise<{
}>;
```

Defined in: [packages/database/src/helpers/projects.ts:85](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/projects.ts#L85)

Update a project.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `input` | [`UpdateProjectInput`](#updateprojectinput) |

#### Returns

`Promise`\<\{
\}\>

***

### updateUser()

```ts
function updateUser(id, input): Promise<{
}>;
```

Defined in: [packages/database/src/helpers/users.ts:59](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/database/src/helpers/users.ts#L59)

Update a user.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `input` | [`UpdateUserInput`](#updateuserinput) |

#### Returns

`Promise`\<\{
\}\>
