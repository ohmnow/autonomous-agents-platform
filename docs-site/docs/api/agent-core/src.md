[**Autonomous Agents Platform API**](../index.md)

***

[Autonomous Agents Platform API](../index.md) / agent-core/src

# agent-core/src

Agent Core Package
==================

Core functionality for the autonomous agents platform.

## Interfaces

### ActivityEvent

Defined in: [packages/agent-core/src/events.ts:98](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/events.ts#L98)

Structured Event Types for Build Activity

These events provide granular visibility into what the autonomous agent
is doing during a build.

#### Extends

- [`BaseEvent`](#baseevent)

#### Properties

| Property | Type | Overrides | Inherited from |
| ------ | ------ | ------ | ------ |
| <a id="activity"></a> `activity` | [`ActivityType`](#activitytype) | - | - |
| <a id="buildid"></a> `buildId` | `string` | - | [`BaseEvent`](#baseevent).[`buildId`](#buildid-1) |
| <a id="description"></a> `description` | `string` | - | - |
| <a id="detail"></a> `detail?` | `string` | - | - |
| <a id="id"></a> `id` | `string` | - | [`BaseEvent`](#baseevent).[`id`](#id-2) |
| <a id="timestamp"></a> `timestamp` | `string` | - | [`BaseEvent`](#baseevent).[`timestamp`](#timestamp-2) |
| <a id="type"></a> `type` | `"activity"` | [`BaseEvent`](#baseevent).[`type`](#type-2) | - |

***

### AgentClientOptions

Defined in: [packages/agent-core/src/types.ts:161](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/types.ts#L161)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="allowedcommands"></a> `allowedCommands` | `string`[] |
| <a id="maxturns"></a> `maxTurns?` | `number` |
| <a id="mcpservers"></a> `mcpServers?` | [`McpServerConfig`](#mcpserverconfig)[] |
| <a id="model"></a> `model` | `string` |
| <a id="projectdir"></a> `projectDir` | `string` |

***

### AgentHarness

Defined in: [packages/agent-core/src/types.ts:97](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/types.ts#L97)

#### Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="allowedcommands-1"></a> `allowedCommands` | `string`[] | Allowed bash commands (security) |
| <a id="completioncheck"></a> `completionCheck` | (`sandbox`) => `Promise`\<`boolean`\> | How to determine if the task is complete |
| <a id="continuationprompt"></a> `continuationPrompt` | `string` | System prompt for continuation agents |
| <a id="description-1"></a> `description` | `string` | - |
| <a id="id-1"></a> `id` | `string` | - |
| <a id="initializerprompt"></a> `initializerPrompt` | `string` | System prompt for the initializer agent |
| <a id="mcpservers-1"></a> `mcpServers?` | [`McpServerConfig`](#mcpserverconfig)[] | MCP servers to enable |
| <a id="name"></a> `name` | `string` | - |
| <a id="progresstracker"></a> `progressTracker` | (`sandbox`) => `Promise`\<[`ProgressState`](#progressstate)\> | How to track progress |

***

### AgentOutput

Defined in: [packages/agent-core/src/types.ts:18](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/types.ts#L18)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="content"></a> `content` | `string` |
| <a id="metadata"></a> `metadata?` | `Record`\<`string`, `unknown`\> |
| <a id="timestamp-1"></a> `timestamp` | `Date` |
| <a id="type-1"></a> `type` | `"error"` \| `"text"` \| `"tool_use"` \| `"tool_result"` |

***

### AgentSessionConfig

Defined in: [packages/agent-core/src/agent.ts:34](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/agent.ts#L34)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="allowedcommands-2"></a> `allowedCommands?` | `Set`\<`string`\> |
| <a id="maxturns-1"></a> `maxTurns?` | `number` |
| <a id="mcpservers-2"></a> `mcpServers?` | `Record`\<`string`, `McpServerConfig`\> |
| <a id="model-1"></a> `model?` | `string` |
| <a id="systemprompt"></a> `systemPrompt?` | `string` |
| <a id="workingdirectory"></a> `workingDirectory` | `string` |

***

### BaseEvent

Defined in: [packages/agent-core/src/events.ts:12](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/events.ts#L12)

Structured Event Types for Build Activity

These events provide granular visibility into what the autonomous agent
is doing during a build.

#### Extended by

- [`PhaseEvent`](#phaseevent)
- [`FeatureStartEvent`](#featurestartevent)
- [`FeatureProgressEvent`](#featureprogressevent)
- [`FeatureEndEvent`](#featureendevent)
- [`ThinkingEvent`](#thinkingevent)
- [`ActivityEvent`](#activityevent)
- [`ToolStartEvent`](#toolstartevent)
- [`ToolEndEvent`](#toolendevent)
- [`FileEvent`](#fileevent)
- [`CommandEvent`](#commandevent)
- [`TestRunEvent`](#testrunevent)
- [`ErrorEvent`](#errorevent)
- [`ProgressEvent`](#progressevent)
- [`FeatureListEvent`](#featurelistevent)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="buildid-1"></a> `buildId` | `string` |
| <a id="id-2"></a> `id` | `string` |
| <a id="timestamp-2"></a> `timestamp` | `string` |
| <a id="type-2"></a> `type` | `string` |

***

### Build

Defined in: [packages/agent-core/src/types.ts:189](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/types.ts#L189)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="appspec"></a> `appSpec` | `string` |
| <a id="completedat"></a> `completedAt?` | `Date` |
| <a id="createdat"></a> `createdAt` | `Date` |
| <a id="harnessid"></a> `harnessId` | `string` |
| <a id="id-3"></a> `id` | `string` |
| <a id="outputurl"></a> `outputUrl?` | `string` |
| <a id="progress"></a> `progress?` | [`ProgressState`](#progressstate) |
| <a id="projectid"></a> `projectId?` | `string` |
| <a id="sandboxid"></a> `sandboxId?` | `string` |
| <a id="sandboxprovider"></a> `sandboxProvider` | `string` |
| <a id="startedat"></a> `startedAt?` | `Date` |
| <a id="status"></a> `status` | [`BuildStatus`](#buildstatus-1) |
| <a id="updatedat"></a> `updatedAt` | `Date` |
| <a id="userid"></a> `userId` | `string` |

***

### BuildLog

Defined in: [packages/agent-core/src/types.ts:181](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/types.ts#L181)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="id-4"></a> `id` | `string` |
| <a id="level"></a> `level` | `"info"` \| `"warn"` \| `"error"` \| `"tool"` |
| <a id="message"></a> `message` | `string` |
| <a id="metadata-1"></a> `metadata?` | `Record`\<`string`, `unknown`\> |
| <a id="timestamp-3"></a> `timestamp` | `Date` |

***

### CommandEvent

Defined in: [packages/agent-core/src/events.ts:109](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/events.ts#L109)

Structured Event Types for Build Activity

These events provide granular visibility into what the autonomous agent
is doing during a build.

#### Extends

- [`BaseEvent`](#baseevent)

#### Properties

| Property | Type | Overrides | Inherited from |
| ------ | ------ | ------ | ------ |
| <a id="buildid-3"></a> `buildId` | `string` | - | [`BaseEvent`](#baseevent).[`buildId`](#buildid-1) |
| <a id="command"></a> `command` | `string` | - | - |
| <a id="durationms"></a> `durationMs` | `number` | - | - |
| <a id="exitcode"></a> `exitCode` | `number` | - | - |
| <a id="id-5"></a> `id` | `string` | - | [`BaseEvent`](#baseevent).[`id`](#id-2) |
| <a id="stderr"></a> `stderr?` | `string` | - | - |
| <a id="stdout"></a> `stdout?` | `string` | - | - |
| <a id="timestamp-4"></a> `timestamp` | `string` | - | [`BaseEvent`](#baseevent).[`timestamp`](#timestamp-2) |
| <a id="type-3"></a> `type` | `"command"` | [`BaseEvent`](#baseevent).[`type`](#type-2) | - |

***

### CustomHarnessOptions

Defined in: [packages/agent-core/src/harnesses/custom.ts:14](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/harnesses/custom.ts#L14)

Options for creating a custom harness.

#### Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="allowedcommands-3"></a> `allowedCommands?` | `string`[] | Allowed bash commands (defaults to coding harness commands) |
| <a id="completioncheck-1"></a> `completionCheck?` | (`sandbox`) => `Promise`\<`boolean`\> | Custom completion check function. Returns true when the task is complete. |
| <a id="continuationprompt-1"></a> `continuationPrompt` | `string` | System prompt for continuation agents |
| <a id="description-2"></a> `description` | `string` | - |
| <a id="id-6"></a> `id` | `string` | - |
| <a id="initializerprompt-1"></a> `initializerPrompt` | `string` | System prompt for the initializer agent |
| <a id="mcpservers-3"></a> `mcpServers?` | [`McpServerConfig`](#mcpserverconfig)[] | MCP servers to enable |
| <a id="name-1"></a> `name` | `string` | - |
| <a id="progresstracker-1"></a> `progressTracker?` | (`sandbox`) => `Promise`\<[`ProgressState`](#progressstate)\> | Custom progress tracker function. Returns the current progress state. |

***

### ErrorEvent

Defined in: [packages/agent-core/src/events.ts:172](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/events.ts#L172)

Structured Event Types for Build Activity

These events provide granular visibility into what the autonomous agent
is doing during a build.

#### Extends

- [`BaseEvent`](#baseevent)

#### Properties

| Property | Type | Overrides | Inherited from |
| ------ | ------ | ------ | ------ |
| <a id="buildid-4"></a> `buildId` | `string` | - | [`BaseEvent`](#baseevent).[`buildId`](#buildid-1) |
| <a id="details"></a> `details?` | `string` | - | - |
| <a id="id-7"></a> `id` | `string` | - | [`BaseEvent`](#baseevent).[`id`](#id-2) |
| <a id="message-1"></a> `message` | `string` | - | - |
| <a id="recoverable"></a> `recoverable` | `boolean` | - | - |
| <a id="recovering"></a> `recovering?` | `boolean` | - | - |
| <a id="severity"></a> `severity` | `"error"` \| `"warning"` \| `"fatal"` | - | - |
| <a id="timestamp-5"></a> `timestamp` | `string` | - | [`BaseEvent`](#baseevent).[`timestamp`](#timestamp-2) |
| <a id="type-4"></a> `type` | `"error"` | [`BaseEvent`](#baseevent).[`type`](#type-2) | - |

***

### EventFeatureListItem

Defined in: [packages/agent-core/src/events.ts:199](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/events.ts#L199)

#### Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="blocking"></a> `blocking?` | `boolean` | If true, must complete before non-blocking features can run in parallel |
| <a id="category"></a> `category` | `"functional"` \| `"style"` | - |
| <a id="dependson"></a> `dependsOn?` | `string`[] | Feature descriptions this feature depends on (for dependency ordering) |
| <a id="description-3"></a> `description` | `string` | - |
| <a id="passes"></a> `passes` | `boolean` | - |
| <a id="steps"></a> `steps` | `string`[] | - |

***

### ExecResult

Defined in: [packages/agent-core/src/types.ts:12](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/types.ts#L12)

Agent Core Types
=================

Shared type definitions for the autonomous agents platform.

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="exitcode-1"></a> `exitCode` | `number` |
| <a id="stderr-1"></a> `stderr` | `string` |
| <a id="stdout-1"></a> `stdout` | `string` |

***

### FeatureEndEvent

Defined in: [packages/agent-core/src/events.ts:62](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/events.ts#L62)

Structured Event Types for Build Activity

These events provide granular visibility into what the autonomous agent
is doing during a build.

#### Extends

- [`BaseEvent`](#baseevent)

#### Properties

| Property | Type | Overrides | Inherited from |
| ------ | ------ | ------ | ------ |
| <a id="buildid-5"></a> `buildId` | `string` | - | [`BaseEvent`](#baseevent).[`buildId`](#buildid-1) |
| <a id="durationms-1"></a> `durationMs` | `number` | - | - |
| <a id="featureid"></a> `featureId` | `string` | - | - |
| <a id="id-8"></a> `id` | `string` | - | [`BaseEvent`](#baseevent).[`id`](#id-2) |
| <a id="status-1"></a> `status` | `"passed"` \| `"failed"` | - | - |
| <a id="summary"></a> `summary?` | `string` | - | - |
| <a id="testsfailed"></a> `testsFailed?` | `number` | - | - |
| <a id="testspassed"></a> `testsPassed?` | `number` | - | - |
| <a id="timestamp-6"></a> `timestamp` | `string` | - | [`BaseEvent`](#baseevent).[`timestamp`](#timestamp-2) |
| <a id="type-5"></a> `type` | `"feature_end"` | [`BaseEvent`](#baseevent).[`type`](#type-2) | - |

***

### FeatureListEvent

Defined in: [packages/agent-core/src/events.ts:210](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/events.ts#L210)

Structured Event Types for Build Activity

These events provide granular visibility into what the autonomous agent
is doing during a build.

#### Extends

- [`BaseEvent`](#baseevent)

#### Properties

| Property | Type | Overrides | Inherited from |
| ------ | ------ | ------ | ------ |
| <a id="buildid-6"></a> `buildId` | `string` | - | [`BaseEvent`](#baseevent).[`buildId`](#buildid-1) |
| <a id="completed"></a> `completed` | `number` | - | - |
| <a id="features"></a> `features` | [`EventFeatureListItem`](#eventfeaturelistitem)[] | - | - |
| <a id="id-9"></a> `id` | `string` | - | [`BaseEvent`](#baseevent).[`id`](#id-2) |
| <a id="timestamp-7"></a> `timestamp` | `string` | - | [`BaseEvent`](#baseevent).[`timestamp`](#timestamp-2) |
| <a id="total"></a> `total` | `number` | - | - |
| <a id="type-6"></a> `type` | `"feature_list"` | [`BaseEvent`](#baseevent).[`type`](#type-2) | - |

***

### FeatureListItem

Defined in: [packages/agent-core/src/progress.ts:15](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/progress.ts#L15)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="category-1"></a> `category` | `"functional"` \| `"style"` |
| <a id="description-4"></a> `description` | `string` |
| <a id="passes-1"></a> `passes` | `boolean` |
| <a id="steps-1"></a> `steps` | `string`[] |

***

### FeatureProgressEvent

Defined in: [packages/agent-core/src/events.ts:54](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/events.ts#L54)

Structured Event Types for Build Activity

These events provide granular visibility into what the autonomous agent
is doing during a build.

#### Extends

- [`BaseEvent`](#baseevent)

#### Properties

| Property | Type | Overrides | Inherited from |
| ------ | ------ | ------ | ------ |
| <a id="buildid-7"></a> `buildId` | `string` | - | [`BaseEvent`](#baseevent).[`buildId`](#buildid-1) |
| <a id="featureid-1"></a> `featureId` | `string` | - | - |
| <a id="id-10"></a> `id` | `string` | - | [`BaseEvent`](#baseevent).[`id`](#id-2) |
| <a id="step"></a> `step` | `string` | - | - |
| <a id="stepindex"></a> `stepIndex?` | `number` | - | - |
| <a id="timestamp-8"></a> `timestamp` | `string` | - | [`BaseEvent`](#baseevent).[`timestamp`](#timestamp-2) |
| <a id="totalsteps"></a> `totalSteps?` | `number` | - | - |
| <a id="type-7"></a> `type` | `"feature_progress"` | [`BaseEvent`](#baseevent).[`type`](#type-2) | - |

***

### FeatureStartEvent

Defined in: [packages/agent-core/src/events.ts:45](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/events.ts#L45)

Structured Event Types for Build Activity

These events provide granular visibility into what the autonomous agent
is doing during a build.

#### Extends

- [`BaseEvent`](#baseevent)

#### Properties

| Property | Type | Overrides | Inherited from |
| ------ | ------ | ------ | ------ |
| <a id="buildid-8"></a> `buildId` | `string` | - | [`BaseEvent`](#baseevent).[`buildId`](#buildid-1) |
| <a id="description-5"></a> `description?` | `string` | - | - |
| <a id="featureid-2"></a> `featureId` | `string` | - | - |
| <a id="featureindex"></a> `featureIndex` | `number` | - | - |
| <a id="id-11"></a> `id` | `string` | - | [`BaseEvent`](#baseevent).[`id`](#id-2) |
| <a id="timestamp-9"></a> `timestamp` | `string` | - | [`BaseEvent`](#baseevent).[`timestamp`](#timestamp-2) |
| <a id="title"></a> `title` | `string` | - | - |
| <a id="totalfeatures"></a> `totalFeatures` | `number` | - | - |
| <a id="type-8"></a> `type` | `"feature_start"` | [`BaseEvent`](#baseevent).[`type`](#type-2) | - |

***

### FeatureStatus

Defined in: [packages/agent-core/src/types.ts:72](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/types.ts#L72)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="category-2"></a> `category` | `"functional"` \| `"style"` |
| <a id="description-6"></a> `description` | `string` |
| <a id="id-12"></a> `id` | `string` |
| <a id="status-2"></a> `status` | [`FeatureStatusValue`](#featurestatusvalue) |
| <a id="steps-2"></a> `steps` | `string`[] |

***

### FileEvent

Defined in: [packages/agent-core/src/events.ts:144](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/events.ts#L144)

Structured Event Types for Build Activity

These events provide granular visibility into what the autonomous agent
is doing during a build.

#### Extends

- [`BaseEvent`](#baseevent)

#### Properties

| Property | Type | Overrides | Inherited from |
| ------ | ------ | ------ | ------ |
| <a id="buildid-9"></a> `buildId` | `string` | - | [`BaseEvent`](#baseevent).[`buildId`](#buildid-1) |
| <a id="id-13"></a> `id` | `string` | - | [`BaseEvent`](#baseevent).[`id`](#id-2) |
| <a id="language"></a> `language?` | `string` | - | - |
| <a id="linesadded"></a> `linesAdded?` | `number` | - | - |
| <a id="linesremoved"></a> `linesRemoved?` | `number` | - | - |
| <a id="path"></a> `path` | `string` | - | - |
| <a id="size"></a> `size?` | `number` | - | - |
| <a id="timestamp-10"></a> `timestamp` | `string` | - | [`BaseEvent`](#baseevent).[`timestamp`](#timestamp-2) |
| <a id="type-9"></a> `type` | `"file_created"` \| `"file_modified"` \| `"file_deleted"` | [`BaseEvent`](#baseevent).[`type`](#type-2) | - |

***

### McpServerConfig

Defined in: [packages/agent-core/src/types.ts:90](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/types.ts#L90)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="args"></a> `args?` | `string`[] |
| <a id="command-1"></a> `command` | `string` |
| <a id="env"></a> `env?` | `Record`\<`string`, `string`\> |
| <a id="name-2"></a> `name` | `string` |

***

### PhaseEvent

Defined in: [packages/agent-core/src/events.ts:33](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/events.ts#L33)

Structured Event Types for Build Activity

These events provide granular visibility into what the autonomous agent
is doing during a build.

#### Extends

- [`BaseEvent`](#baseevent)

#### Properties

| Property | Type | Overrides | Inherited from |
| ------ | ------ | ------ | ------ |
| <a id="buildid-10"></a> `buildId` | `string` | - | [`BaseEvent`](#baseevent).[`buildId`](#buildid-1) |
| <a id="id-14"></a> `id` | `string` | - | [`BaseEvent`](#baseevent).[`id`](#id-2) |
| <a id="message-2"></a> `message?` | `string` | - | - |
| <a id="phase"></a> `phase` | [`BuildPhase`](#buildphase) | - | - |
| <a id="timestamp-11"></a> `timestamp` | `string` | - | [`BaseEvent`](#baseevent).[`timestamp`](#timestamp-2) |
| <a id="type-10"></a> `type` | `"phase"` | [`BaseEvent`](#baseevent).[`type`](#type-2) | - |

***

### ProgressEvent

Defined in: [packages/agent-core/src/events.ts:185](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/events.ts#L185)

Structured Event Types for Build Activity

These events provide granular visibility into what the autonomous agent
is doing during a build.

#### Extends

- [`BaseEvent`](#baseevent)

#### Properties

| Property | Type | Overrides | Inherited from |
| ------ | ------ | ------ | ------ |
| <a id="averagefeaturedurationms"></a> `averageFeatureDurationMs?` | `number` | - | - |
| <a id="buildid-11"></a> `buildId` | `string` | - | [`BaseEvent`](#baseevent).[`buildId`](#buildid-1) |
| <a id="completed-1"></a> `completed` | `number` | - | - |
| <a id="currentfeature"></a> `currentFeature?` | `string` | - | - |
| <a id="estimatedremainingms"></a> `estimatedRemainingMs?` | `number` | - | - |
| <a id="id-15"></a> `id` | `string` | - | [`BaseEvent`](#baseevent).[`id`](#id-2) |
| <a id="percentcomplete"></a> `percentComplete` | `number` | - | - |
| <a id="timestamp-12"></a> `timestamp` | `string` | - | [`BaseEvent`](#baseevent).[`timestamp`](#timestamp-2) |
| <a id="total-1"></a> `total` | `number` | - | - |
| <a id="type-11"></a> `type` | `"progress"` | [`BaseEvent`](#baseevent).[`type`](#type-2) | - |

***

### ProgressState

Defined in: [packages/agent-core/src/types.ts:80](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/types.ts#L80)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="completed-2"></a> `completed` | `number` |
| <a id="features-1"></a> `features` | [`FeatureStatus`](#featurestatus)[] |
| <a id="total-2"></a> `total` | `number` |

***

### PromptOverrides

Defined in: [packages/agent-core/src/prompts.ts:733](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/prompts.ts#L733)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="codingprompt"></a> `codingPrompt?` | `string` |
| <a id="initializerprompt-2"></a> `initializerPrompt?` | `string` |

***

### RunAgentOptions

Defined in: [packages/agent-core/src/agent.ts:49](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/agent.ts#L49)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="harness"></a> `harness?` | [`AgentHarness`](#agentharness) |
| <a id="maxiterations"></a> `maxIterations?` | `number` |
| <a id="model-2"></a> `model?` | `string` |
| <a id="onlog"></a> `onLog?` | (`level`, `message`, `metadata?`) => `void` |
| <a id="onprogress"></a> `onProgress?` | (`state`) => `void` |
| <a id="projectdir-1"></a> `projectDir` | `string` |

***

### Sandbox

Defined in: [packages/agent-core/src/types.ts:25](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/types.ts#L25)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="id-16"></a> `id` | `string` |
| <a id="status-3"></a> `status` | `"error"` \| `"creating"` \| `"running"` \| `"stopped"` |

#### Methods

##### destroy()

```ts
destroy(): Promise<void>;
```

Defined in: [packages/agent-core/src/types.ts:45](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/types.ts#L45)

Stop and destroy the sandbox

###### Returns

`Promise`\<`void`\>

##### downloadDir()

```ts
downloadDir(path): Promise<Buffer<ArrayBufferLike>>;
```

Defined in: [packages/agent-core/src/types.ts:42](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/types.ts#L42)

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

Defined in: [packages/agent-core/src/types.ts:30](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/types.ts#L30)

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

Defined in: [packages/agent-core/src/types.ts:33](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/types.ts#L33)

Stream command output

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `command` | `string` |

###### Returns

`AsyncIterable`\<`string`\>

##### onOutput()

```ts
onOutput(callback): () => void;
```

Defined in: [packages/agent-core/src/types.ts:48](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/types.ts#L48)

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

Defined in: [packages/agent-core/src/types.ts:39](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/types.ts#L39)

Read a file from the sandbox

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

###### Returns

`Promise`\<`string`\>

##### writeFile()

```ts
writeFile(path, content): Promise<void>;
```

Defined in: [packages/agent-core/src/types.ts:36](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/types.ts#L36)

Write a file to the sandbox

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |
| `content` | `string` |

###### Returns

`Promise`\<`void`\>

***

### SandboxAgentOptions

Defined in: [packages/agent-core/src/agent.ts:368](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/agent.ts#L368)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="appspec-1"></a> `appSpec` | `string` |
| <a id="harness-1"></a> `harness` | [`AgentHarness`](#agentharness) |
| <a id="maxiterations-1"></a> `maxIterations?` | `number` |
| <a id="model-3"></a> `model?` | `string` |
| <a id="onlog-1"></a> `onLog?` | (`level`, `message`, `metadata?`) => `void` |
| <a id="onprogress-1"></a> `onProgress?` | (`state`) => `void` |
| <a id="sandbox-1"></a> `sandbox` | [`Sandbox`](#sandbox) |

***

### SandboxConfig

Defined in: [packages/agent-core/src/types.ts:51](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/types.ts#L51)

#### Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="env-1"></a> `env?` | `Record`\<`string`, `string`\> | Environment variables |
| <a id="resources"></a> `resources?` | `object` | Resource limits |
| `resources.cpu?` | `number` | - |
| `resources.disk?` | `string` | - |
| `resources.memory?` | `string` | - |
| <a id="template"></a> `template?` | `string` | Provider-specific template/image |
| <a id="timeout"></a> `timeout?` | `number` | Timeout in seconds |

***

### SecurityHookInput

Defined in: [packages/agent-core/src/types.ts:125](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/types.ts#L125)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="tool_input"></a> `tool_input` | `Record`\<`string`, `unknown`\> |
| <a id="tool_name"></a> `tool_name` | `string` |

***

### SecurityHookResult

Defined in: [packages/agent-core/src/types.ts:130](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/types.ts#L130)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="decision"></a> `decision?` | `"block"` |
| <a id="reason"></a> `reason?` | `string` |

***

### SessionResult

Defined in: [packages/agent-core/src/types.ts:147](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/types.ts#L147)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="responsetext"></a> `responseText` | `string` |
| <a id="status-4"></a> `status` | [`SessionStatus`](#sessionstatus) |
| <a id="toolcalls"></a> `toolCalls?` | [`ToolCall`](#toolcall)[] |

***

### TestRunEvent

Defined in: [packages/agent-core/src/events.ts:157](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/events.ts#L157)

Structured Event Types for Build Activity

These events provide granular visibility into what the autonomous agent
is doing during a build.

#### Extends

- [`BaseEvent`](#baseevent)

#### Properties

| Property | Type | Overrides | Inherited from |
| ------ | ------ | ------ | ------ |
| <a id="buildid-12"></a> `buildId` | `string` | - | [`BaseEvent`](#baseevent).[`buildId`](#buildid-1) |
| <a id="command-2"></a> `command` | `string` | - | - |
| <a id="durationms-2"></a> `durationMs` | `number` | - | - |
| <a id="failed"></a> `failed` | `number` | - | - |
| <a id="id-17"></a> `id` | `string` | - | [`BaseEvent`](#baseevent).[`id`](#id-2) |
| <a id="output"></a> `output?` | `string` | - | - |
| <a id="passed"></a> `passed` | `number` | - | - |
| <a id="skipped"></a> `skipped` | `number` | - | - |
| <a id="timestamp-13"></a> `timestamp` | `string` | - | [`BaseEvent`](#baseevent).[`timestamp`](#timestamp-2) |
| <a id="total-3"></a> `total` | `number` | - | - |
| <a id="type-12"></a> `type` | `"test_run"` | [`BaseEvent`](#baseevent).[`type`](#type-2) | - |

***

### ThinkingEvent

Defined in: [packages/agent-core/src/events.ts:76](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/events.ts#L76)

Structured Event Types for Build Activity

These events provide granular visibility into what the autonomous agent
is doing during a build.

#### Extends

- [`BaseEvent`](#baseevent)

#### Properties

| Property | Type | Overrides | Inherited from |
| ------ | ------ | ------ | ------ |
| <a id="buildid-13"></a> `buildId` | `string` | - | [`BaseEvent`](#baseevent).[`buildId`](#buildid-1) |
| <a id="content-1"></a> `content` | `string` | - | - |
| <a id="id-18"></a> `id` | `string` | - | [`BaseEvent`](#baseevent).[`id`](#id-2) |
| <a id="phase-1"></a> `phase` | `"analyzing"` \| `"planning"` \| `"deciding"` | - | - |
| <a id="timestamp-14"></a> `timestamp` | `string` | - | [`BaseEvent`](#baseevent).[`timestamp`](#timestamp-2) |
| <a id="type-13"></a> `type` | `"thinking"` | [`BaseEvent`](#baseevent).[`type`](#type-2) | - |

***

### TierDetails

Defined in: [packages/agent-core/src/prompts.ts:18](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/prompts.ts#L18)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="buildtime"></a> `buildTime` | `string` |
| <a id="defaultfeatures"></a> `defaultFeatures` | `number` |
| <a id="description-7"></a> `description` | `string` |
| <a id="featurerange"></a> `featureRange` | `string` |
| <a id="name-3"></a> `name` | `string` |

***

### ToolCall

Defined in: [packages/agent-core/src/types.ts:153](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/types.ts#L153)

#### Properties

| Property | Type |
| ------ | ------ |
| <a id="id-19"></a> `id` | `string` |
| <a id="input"></a> `input` | `Record`\<`string`, `unknown`\> |
| <a id="iserror"></a> `isError?` | `boolean` |
| <a id="name-4"></a> `name` | `string` |
| <a id="result"></a> `result?` | `string` |

***

### ToolEndEvent

Defined in: [packages/agent-core/src/events.ts:130](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/events.ts#L130)

Structured Event Types for Build Activity

These events provide granular visibility into what the autonomous agent
is doing during a build.

#### Extends

- [`BaseEvent`](#baseevent)

#### Properties

| Property | Type | Overrides | Inherited from |
| ------ | ------ | ------ | ------ |
| <a id="buildid-14"></a> `buildId` | `string` | - | [`BaseEvent`](#baseevent).[`buildId`](#buildid-1) |
| <a id="displayoutput"></a> `displayOutput?` | `string` | - | - |
| <a id="durationms-3"></a> `durationMs` | `number` | - | - |
| <a id="error"></a> `error?` | `string` | - | - |
| <a id="id-20"></a> `id` | `string` | - | [`BaseEvent`](#baseevent).[`id`](#id-2) |
| <a id="output-1"></a> `output?` | `string` | - | - |
| <a id="success"></a> `success` | `boolean` | - | - |
| <a id="timestamp-15"></a> `timestamp` | `string` | - | [`BaseEvent`](#baseevent).[`timestamp`](#timestamp-2) |
| <a id="tooluseid"></a> `toolUseId` | `string` | - | - |
| <a id="type-14"></a> `type` | `"tool_end"` | [`BaseEvent`](#baseevent).[`type`](#type-2) | - |

***

### ToolStartEvent

Defined in: [packages/agent-core/src/events.ts:122](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/events.ts#L122)

Structured Event Types for Build Activity

These events provide granular visibility into what the autonomous agent
is doing during a build.

#### Extends

- [`BaseEvent`](#baseevent)

#### Properties

| Property | Type | Overrides | Inherited from |
| ------ | ------ | ------ | ------ |
| <a id="buildid-15"></a> `buildId` | `string` | - | [`BaseEvent`](#baseevent).[`buildId`](#buildid-1) |
| <a id="displayinput"></a> `displayInput?` | `string` | - | - |
| <a id="id-21"></a> `id` | `string` | - | [`BaseEvent`](#baseevent).[`id`](#id-2) |
| <a id="input-1"></a> `input` | `Record`\<`string`, `unknown`\> | - | - |
| <a id="timestamp-16"></a> `timestamp` | `string` | - | [`BaseEvent`](#baseevent).[`timestamp`](#timestamp-2) |
| <a id="toolname"></a> `toolName` | `"bash"` \| `"write_file"` \| `"read_file"` \| `"str_replace_editor"` | - | - |
| <a id="tooluseid-1"></a> `toolUseId` | `string` | - | - |
| <a id="type-15"></a> `type` | `"tool_start"` | [`BaseEvent`](#baseevent).[`type`](#type-2) | - |

## Type Aliases

### ActivityType

```ts
type ActivityType = 
  | "thinking"
  | "planning"
  | "implementing"
  | "writing_code"
  | "running_command"
  | "running_tests"
  | "reading_file"
  | "analyzing_output"
  | "fixing_error"
  | "idle";
```

Defined in: [packages/agent-core/src/events.ts:86](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/events.ts#L86)

***

### AgentEvent

```ts
type AgentEvent = 
  | PhaseEvent
  | FeatureStartEvent
  | FeatureProgressEvent
  | FeatureEndEvent
  | ThinkingEvent
  | ActivityEvent
  | ToolStartEvent
  | ToolEndEvent
  | FileEvent
  | CommandEvent
  | TestRunEvent
  | ErrorEvent
  | ProgressEvent
  | FeatureListEvent;
```

Defined in: [packages/agent-core/src/events.ts:221](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/events.ts#L221)

***

### BuildPhase

```ts
type BuildPhase = 
  | "initializing"
  | "analyzing"
  | "planning"
  | "implementing"
  | "testing"
  | "finalizing"
  | "completed"
  | "failed";
```

Defined in: [packages/agent-core/src/events.ts:23](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/events.ts#L23)

***

### BuildStatus

```ts
type BuildStatus = 
  | "pending"
  | "initializing"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";
```

Defined in: [packages/agent-core/src/types.ts:173](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/types.ts#L173)

***

### ComplexityTier

```ts
type ComplexityTier = "simple" | "standard" | "production";
```

Defined in: [packages/agent-core/src/prompts.ts:16](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/prompts.ts#L16)

Prompt Loading Utilities
========================

Functions for loading and managing prompt templates.
Ported from Python implementation.

Updated December 2024: Added two-stage spec generation support with
dynamic feature counts based on complexity tier.

***

### EventCategory

```ts
type EventCategory = 
  | "thought"
  | "tool"
  | "file"
  | "feature"
  | "progress"
  | "phase"
  | "command"
  | "test"
  | "activity"
  | "error";
```

Defined in: [packages/agent-core/src/events.ts:242](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/events.ts#L242)

Event categories for UI filtering

***

### EventFeatureStatus

```ts
type EventFeatureStatus = "pending" | "in_progress" | "testing" | "passed" | "failed";
```

Defined in: [packages/agent-core/src/events.ts:43](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/events.ts#L43)

***

### EventType

```ts
type EventType = AgentEvent["type"];
```

Defined in: [packages/agent-core/src/events.ts:237](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/events.ts#L237)

***

### FeatureStatusValue

```ts
type FeatureStatusValue = "pending" | "in_progress" | "passed" | "failed";
```

Defined in: [packages/agent-core/src/types.ts:70](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/types.ts#L70)

***

### SecurityHook()

```ts
type SecurityHook = (input, toolUseId?, context?) => Promise<SecurityHookResult>;
```

Defined in: [packages/agent-core/src/types.ts:135](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/types.ts#L135)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`SecurityHookInput`](#securityhookinput) |
| `toolUseId?` | `string` |
| `context?` | `unknown` |

#### Returns

`Promise`\<[`SecurityHookResult`](#securityhookresult)\>

***

### SessionStatus

```ts
type SessionStatus = "continue" | "complete" | "error";
```

Defined in: [packages/agent-core/src/types.ts:145](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/types.ts#L145)

## Variables

### AUTO\_CONTINUE\_DELAY\_MS

```ts
const AUTO_CONTINUE_DELAY_MS: 3000 = 3000;
```

Defined in: [packages/agent-core/src/agent.ts:27](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/agent.ts#L27)

***

### bashSecurityHook

```ts
const bashSecurityHook: SecurityHook;
```

Defined in: [packages/agent-core/src/security.ts:420](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/security.ts#L420)

Default bash security hook using the default allowed commands.

***

### CODING\_ALLOWED\_COMMANDS

```ts
const CODING_ALLOWED_COMMANDS: string[];
```

Defined in: [packages/agent-core/src/harnesses/coding.ts:16](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/harnesses/coding.ts#L16)

Allowed bash commands for the coding harness.
Minimal set needed for development tasks.

***

### CODING\_PROMPT

```ts
const CODING_PROMPT: "## YOUR ROLE - CODING AGENT\n\nYou are continuing work on a long-running autonomous development task.\nThis is a FRESH context window - you have no memory of previous sessions.\n\n### STEP 1: GET YOUR BEARINGS (MANDATORY)\n\nStart by orienting yourself:\n\n```bash\n# 1. See your working directory\npwd\n\n# 2. List files to understand project structure\nls -la\n\n# 3. Read the project specification to understand what you're building\ncat app_spec.txt\n\n# 4. Read the feature list to see all work\ncat feature_list.json | head -50\n\n# 5. Read progress notes from previous sessions\ncat claude-progress.txt\n\n# 6. Check recent git history\ngit log --oneline -20\n\n# 7. Count remaining tests\ncat feature_list.json | grep '\"passes\": false' | wc -l\n```\n\nUnderstanding the `app_spec.txt` is critical - it contains the full requirements\nfor the application you're building.\n\n### STEP 2: START SERVERS (IF NOT RUNNING)\n\nIf `init.sh` exists, run it:\n```bash\nchmod +x init.sh\n./init.sh\n```\n\nOtherwise, start servers manually and document the process.\n\n### STEP 3: VERIFICATION TEST (CRITICAL!)\n\n**MANDATORY BEFORE NEW WORK:**\n\nThe previous session may have introduced bugs. Before implementing anything\nnew, you MUST run verification tests.\n\nRun 1-2 of the feature tests marked as `"passes\": true` that are most core to the app's functionality to verify they still work.\nFor example, if this were a chat app, you should perform a test that logs into the app, sends a message, and gets a response.\n\n**If you find ANY issues (functional or visual):**\n- Mark that feature as \"passes\": false immediately\n- Add issues to a list\n- Fix all issues BEFORE moving to new features\n- This includes UI bugs like:\n  * White-on-white text or poor contrast\n  * Random characters displayed\n  * Incorrect timestamps\n  * Layout issues or overflow\n  * Buttons too close together\n  * Missing hover states\n  * Console errors\n\n### STEP 4: CHOOSE ONE FEATURE TO IMPLEMENT\n\nLook at feature_list.json and find the highest-priority feature with \"passes\": false.\n\nFocus on completing one feature perfectly and completing its testing steps in this session before moving on to other features.\nIt's ok if you only complete one feature in this session, as there will be more sessions later that continue to make progress.\n\n### STEP 5: IMPLEMENT THE FEATURE\n\nImplement the chosen feature thoroughly:\n1. Write the code (frontend and/or backend as needed)\n2. Test manually using browser automation (see Step 6)\n3. Fix any issues discovered\n4. Verify the feature works end-to-end\n\n### STEP 6: VERIFY WITH BROWSER AUTOMATION\n\n**CRITICAL:** You MUST verify features through the actual UI.\n\nUse browser automation tools:\n- Navigate to the app in a real browser\n- Interact like a human user (click, type, scroll)\n- Take screenshots at each step\n- Verify both functionality AND visual appearance\n\n**DO:**\n- Test through the UI with clicks and keyboard input\n- Take screenshots to verify visual appearance\n- Check for console errors in browser\n- Verify complete user workflows end-to-end\n\n**DON'T:**\n- Only test with curl commands (backend testing alone is insufficient)\n- Use JavaScript evaluation to bypass UI (no shortcuts)\n- Skip visual verification\n- Mark tests passing without thorough verification\n\n### STEP 7: UPDATE feature_list.json (CAREFULLY!)\n\n**YOU CAN ONLY MODIFY ONE FIELD: \"passes\"**\n\nAfter thorough verification, change:\n```json\n\"passes\": false\n```\nto:\n```json\n\"passes\": true\n```\n\n**NEVER:**\n- Remove tests\n- Edit test descriptions\n- Modify test steps\n- Combine or consolidate tests\n- Reorder tests\n\n**ONLY CHANGE \"passes\" FIELD AFTER VERIFICATION WITH SCREENSHOTS.**\n\n### STEP 8: COMMIT YOUR PROGRESS\n\nMake a descriptive git commit:\n```bash\ngit add .\ngit commit -m \"Implement [feature name] - verified end-to-end\n\n- Added [specific changes]\n- Tested with browser automation\n- Updated feature_list.json: marked test #X as passing\n- Screenshots in verification/ directory\n\"\n```\n\n### STEP 9: UPDATE PROGRESS NOTES\n\nUpdate `claude-progress.txt` with:\n- What you accomplished this session\n- Which test(s) you completed\n- Any issues discovered or fixed\n- What should be worked on next\n- Current completion status (e.g., \"45/200 tests passing\")\n\n### STEP 10: END SESSION CLEANLY\n\nBefore context fills up:\n1. Commit all working code\n2. Update claude-progress.txt\n3. Update feature_list.json if tests verified\n4. Ensure no uncommitted changes\n5. Leave app in working state (no broken features)\n\n---\n\n## TESTING REQUIREMENTS\n\n**ALL testing must use browser automation tools.**\n\nAvailable tools:\n- puppeteer_navigate - Start browser and go to URL\n- puppeteer_screenshot - Capture screenshot\n- puppeteer_click - Click elements\n- puppeteer_fill - Fill form inputs\n- puppeteer_evaluate - Execute JavaScript (use sparingly, only for debugging)\n\nTest like a human user with mouse and keyboard. Don't take shortcuts by using JavaScript evaluation.\nDon't use the puppeteer \"active tab\" tool.\n\n---\n\n## IMPORTANT REMINDERS\n\n**Your Goal:** Production-quality application with all 200+ tests passing\n\n**This Session's Goal:** Complete at least one feature perfectly\n\n**Priority:** Fix broken tests before implementing new features\n\n**Quality Bar:**\n- Zero console errors\n- Polished UI matching the design specified in app_spec.txt\n- All features work end-to-end through the UI\n- Fast, responsive, professional\n\n**You have unlimited time.** Take as long as needed to get it right. The most important thing is that you\nleave the code base in a clean state before terminating the session (Step 10).\n\n---\n\nBegin by running Step 1 (Get Your Bearings).";
```

Defined in: [packages/agent-core/src/prompts.ts:386](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/prompts.ts#L386)

Coding agent prompt for continuation sessions.
This agent continues work on the project.

***

### codingHarness

```ts
const codingHarness: AgentHarness;
```

Defined in: [packages/agent-core/src/harnesses/coding.ts:134](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/harnesses/coding.ts#L134)

Coding harness for autonomous web application development.

This harness is designed to:
- Build web applications from an app_spec.txt specification
- Generate and track 200+ feature tests
- Use browser automation for verification
- Maintain production-quality code

***

### COMMANDS\_NEEDING\_EXTRA\_VALIDATION

```ts
const COMMANDS_NEEDING_EXTRA_VALIDATION: Set<string>;
```

Defined in: [packages/agent-core/src/security.ts:52](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/security.ts#L52)

Commands that need additional validation even when in the allowlist.

***

### DEFAULT\_ALLOWED\_COMMANDS

```ts
const DEFAULT_ALLOWED_COMMANDS: Set<string>;
```

Defined in: [packages/agent-core/src/security.ts:21](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/security.ts#L21)

Default allowed commands for development tasks.
Minimal set needed for the autonomous coding demo.

***

### DEFAULT\_MAX\_TURNS

```ts
const DEFAULT_MAX_TURNS: 1000 = 1000;
```

Defined in: [packages/agent-core/src/agent.ts:28](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/agent.ts#L28)

***

### DEFAULT\_MODEL

```ts
const DEFAULT_MODEL: "claude-sonnet-4-5-20250929" = 'claude-sonnet-4-5-20250929';
```

Defined in: [packages/agent-core/src/agent.ts:26](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/agent.ts#L26)

***

### DISCOVERY\_SYSTEM\_PROMPT

```ts
const DISCOVERY_SYSTEM_PROMPT: "You are an expert software architect helping users design applications. Your goal is to understand their requirements through natural conversation and produce a clear App Description.\n\n## Your Role\n1. Ask clarifying questions to understand what they want to build\n2. Help them think through aspects they might not have considered\n3. Infer the appropriate complexity tier from context (don't ask directly)\n4. Produce a structured App Description\n\n## Conversation Flow\n1. Understand the core purpose: \"What problem does this solve?\"\n2. Identify target users: \"Who will use this?\" (personal, team, customers)\n3. Discuss key features: \"What are the must-have features?\"\n4. Clarify scope: \"Any specific requirements or constraints?\"\n5. Tech preferences (if any): \"Do you have preferences for tech stack?\"\n\n## Complexity Inference (Internal - Don't Ask User)\nInfer the tier from conversational cues:\n\n**Simple (20-40 features)** - Look for signals like:\n- \"just for me\", \"personal\", \"prototype\", \"quick\", \"simple\"\n- \"learning project\", \"side project\", \"experiment\"\n- Single user, no auth complexity needed\n\n**Standard (60-120 features)** - Look for signals like:\n- \"for my team\", \"small business\", \"internal tool\"\n- \"dashboard\", \"admin panel\", \"10-50 users\"\n- Multi-user but not public-facing\n\n**Production (150-250+ features)** - Look for signals like:\n- \"customers\", \"SaaS\", \"commercial\", \"sell to\"\n- \"enterprise\", \"scale\", \"thousands of users\"\n- \"billing\", \"security\", \"multi-tenant\"\n\n## Output Format\nWhen you have enough information, output an App Description block:\n\n```app_description\n# [App Name]\n\n## Overview\n[2-3 paragraph description of what the app does, who it's for, and the problem it solves]\n\n## Target Users\n[Who will use this app and in what context]\n\n## Key Features\n- [Feature 1]\n- [Feature 2]\n- [Feature 3]\n...\n\n## Technical Preferences\n- Frontend: [preference or \"no preference\"]\n- Backend: [preference or \"no preference\"]\n- Database: [preference or \"no preference\"]\n- Authentication: [preference or \"no preference\"]\n\n## Inferred Complexity\nTier: [simple|standard|production]\nEstimated Features: [number]\nReasoning: [1-2 sentences explaining why this tier was chosen]\n```\n\n## Guidelines\n- Be conversational and helpful, not interrogative\n- Don't overwhelm with too many questions at once\n- Suggest sensible defaults when user is unsure\n- NEVER ask \"do you want simple, standard, or production?\"\n- Infer complexity naturally from what they describe\n- After the description, ask if they want to proceed to full spec generation";
```

Defined in: [packages/agent-core/src/prompts.ts:58](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/prompts.ts#L58)

Discovery system prompt for the first stage of spec generation.
This prompts the AI to gather requirements and infer complexity.

***

### EXPANSION\_SYSTEM\_PROMPT

```ts
const EXPANSION_SYSTEM_PROMPT: "You are an expert software architect. Given an App Description, generate a comprehensive XML app specification.\n\n## Input\nYou will receive an App Description containing:\n- Overview and purpose\n- Target users\n- Key features\n- Technical preferences\n- Inferred complexity tier and feature count\n\n## Your Task\nExpand this into a complete XML specification with:\n- Full database schema with all tables and columns\n- Complete API endpoint definitions\n- Detailed UI layout for all pages\n- Design system specifications\n- Implementation priorities\n\n## Complexity-Based Detail Levels\n\n**Simple (20-40 features)**:\n- 3-5 feature groups\n- 1-3 database tables\n- 5-15 API endpoints\n- 2-4 pages\n\n**Standard (60-120 features)**:\n- 6-12 feature groups\n- 4-8 database tables\n- 15-40 API endpoints\n- 5-10 pages\n\n**Production (150-250+ features)**:\n- 12-25+ feature groups\n- 8-15+ database tables\n- 40-100+ API endpoints\n- 10-20+ pages\n\n## XML Output Format\n\n```app_spec\n<project_specification>\n  <project_name>App Name</project_name>\n  \n  <overview>\n    Comprehensive description from the App Description, expanded with\n    additional context about the problem being solved.\n  </overview>\n  \n  <complexity_tier>simple|standard|production</complexity_tier>\n  <target_features>N</target_features>\n  \n  <technology_stack>\n    <frontend>\n      <framework>Framework choice with version</framework>\n      <styling>CSS approach</styling>\n      <state_management>State management approach</state_management>\n      <ui_components>Component library if any</ui_components>\n    </frontend>\n    <backend>\n      <runtime>Backend runtime</runtime>\n      <database>Database choice</database>\n      <authentication>Auth provider</authentication>\n    </backend>\n  </technology_stack>\n  \n  <core_features>\n    <feature_group name=\"Group Name\">\n      <feature>Specific feature description</feature>\n    </feature_group>\n  </core_features>\n  \n  <database_schema>\n    <table name=\"table_name\">\n      <column>column_name: type, constraints</column>\n    </table>\n  </database_schema>\n  \n  <api_endpoints>\n    <endpoint_group name=\"Group Name\">\n      <endpoint method=\"METHOD\" path=\"/path\">Description</endpoint>\n    </endpoint_group>\n  </api_endpoints>\n  \n  <ui_layout>\n    <page name=\"Page Name\">\n      <section>Section description</section>\n    </page>\n  </ui_layout>\n  \n  <design_system>\n    <colors>\n      <primary>Color value</primary>\n      <secondary>Color value</secondary>\n      <background>Color values for light/dark</background>\n    </colors>\n    <typography>\n      <font_family>Font stack</font_family>\n    </typography>\n    <components>\n      <buttons>Style description</buttons>\n      <cards>Style description</cards>\n      <inputs>Style description</inputs>\n    </components>\n  </design_system>\n  \n  <implementation_priorities>\n    <priority level=\"1\">Most critical features</priority>\n    <priority level=\"2\">Important features</priority>\n    <priority level=\"3\">Nice-to-have features</priority>\n  </implementation_priorities>\n  \n  <success_criteria>\n    <criterion category=\"functionality\">Criterion description</criterion>\n    <criterion category=\"ux\">Criterion description</criterion>\n    <criterion category=\"quality\">Criterion description</criterion>\n  </success_criteria>\n</project_specification>\n```\n\n## Output Requirements (CRITICAL)\n- **ALWAYS generate the COMPLETE XML specification**\n- **NEVER truncate or use placeholders** like \"<!-- more features -->\"\n- **Match detail level to the specified complexity tier**\n- Every feature group should have 3-10 specific features\n- Database schema must include all tables with complete column definitions\n- API endpoints must cover all CRUD operations for all resources\n- UI layout must describe all pages and their sections\n- The spec must be detailed enough for an autonomous agent to build the app";
```

Defined in: [packages/agent-core/src/prompts.ts:137](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/prompts.ts#L137)

Expansion system prompt for generating the full XML app spec.
This takes an App Description and expands it into a complete specification.

***

### ~~INITIALIZER\_PROMPT~~

```ts
const INITIALIZER_PROMPT: "## YOUR ROLE - INITIALIZER AGENT (Session 1 of Many)\n\nYou are the FIRST agent in a long-running autonomous development process.\nYour job is to set up the foundation for all future coding agents.\n\n### FIRST: Read the Project Specification\n\nStart by reading `app_spec.txt` in your working directory. This file contains\nthe complete specification for what you need to build. Read it carefully\nbefore proceeding.\n\n### CRITICAL FIRST TASK: Create feature_list.json\n\nBased on `app_spec.txt`, create a file called `feature_list.json` with 200 detailed\nend-to-end test cases. This file is the single source of truth for what\nneeds to be built.\n\n**Format:**\n```json\n[\n  {\n    \"category\": \"functional\",\n    \"description\": \"Brief description of the feature and what this test verifies\",\n    \"steps\": [\n      \"Step 1: Navigate to relevant page\",\n      \"Step 2: Perform action\",\n      \"Step 3: Verify expected result\"\n    ],\n    \"passes\": false\n  },\n  {\n    \"category\": \"style\",\n    \"description\": \"Brief description of UI/UX requirement\",\n    \"steps\": [\n      \"Step 1: Navigate to page\",\n      \"Step 2: Take screenshot\",\n      \"Step 3: Verify visual requirements\"\n    ],\n    \"passes\": false\n  }\n]\n```\n\n**Requirements for feature_list.json:**\n- Minimum 200 features total with testing steps for each\n- Both \"functional\" and \"style\" categories\n- Mix of narrow tests (2-5 steps) and comprehensive tests (10+ steps)\n- At least 25 tests MUST have 10+ steps each\n- Order features by priority: fundamental features first\n- ALL tests start with \"passes\": false\n- Cover every feature in the spec exhaustively\n\n**CRITICAL INSTRUCTION:**\nIT IS CATASTROPHIC TO REMOVE OR EDIT FEATURES IN FUTURE SESSIONS.\nFeatures can ONLY be marked as passing (change \"passes\": false to \"passes\": true).\nNever remove features, never edit descriptions, never modify testing steps.\nThis ensures no functionality is missed.\n\n### SECOND TASK: Create init.sh\n\nCreate a script called `init.sh` that future agents can use to quickly\nset up and run the development environment. The script should:\n\n1. Install any required dependencies\n2. Start any necessary servers or services\n3. Print helpful information about how to access the running application\n\nBase the script on the technology stack specified in `app_spec.txt`.\n\n### THIRD TASK: Initialize Git\n\nCreate a git repository and make your first commit with:\n- feature_list.json (complete with all 200+ features)\n- init.sh (environment setup script)\n- README.md (project overview and setup instructions)\n\nCommit message: \"Initial setup: feature_list.json, init.sh, and project structure\"\n\n### FOURTH TASK: Create Project Structure\n\nSet up the basic project structure based on what's specified in `app_spec.txt`.\nThis typically includes directories for frontend, backend, and any other\ncomponents mentioned in the spec.\n\n### OPTIONAL: Start Implementation\n\nIf you have time remaining in this session, you may begin implementing\nthe highest-priority features from feature_list.json. Remember:\n- Work on ONE feature at a time\n- Test thoroughly before marking \"passes\": true\n- Commit your progress before session ends\n\n### ENDING THIS SESSION\n\nBefore your context fills up:\n1. Commit all work with descriptive messages\n2. Create `claude-progress.txt` with a summary of what you accomplished\n3. Ensure feature_list.json is complete and saved\n4. Leave the environment in a clean, working state\n\nThe next agent will continue from here with a fresh context window.\n\n---\n\n**Remember:** You have unlimited time across many sessions. Focus on\nquality over speed. Production-ready is the goal.";
```

Defined in: [packages/agent-core/src/prompts.ts:275](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/prompts.ts#L275)

Legacy initializer prompt with hardcoded 200 features.

#### Deprecated

Use getInitializerPrompt(targetFeatures) instead

***

### TIER\_DETAILS

```ts
const TIER_DETAILS: Record<ComplexityTier, TierDetails>;
```

Defined in: [packages/agent-core/src/prompts.ts:26](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/prompts.ts#L26)

## Functions

### countPassingTests()

```ts
function countPassingTests(featureListContent): object;
```

Defined in: [packages/agent-core/src/progress.ts:44](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/progress.ts#L44)

Count passing and total tests from feature list content.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `featureListContent` | `string` |

#### Returns

`object`

| Name | Type |
| ------ | ------ |
| `passing` | `number` |
| `total` | `number` |

***

### countPassingTestsFromSandbox()

```ts
function countPassingTestsFromSandbox(sandbox): Promise<{
  passing: number;
  total: number;
}>;
```

Defined in: [packages/agent-core/src/progress.ts:60](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/progress.ts#L60)

Count passing tests from a sandbox by reading feature_list.json.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sandbox` | [`Sandbox`](#sandbox) |

#### Returns

`Promise`\<\{
  `passing`: `number`;
  `total`: `number`;
\}\>

***

### createBashSecurityHook()

```ts
function createBashSecurityHook(allowedCommands): SecurityHook;
```

Defined in: [packages/agent-core/src/security.ts:344](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/security.ts#L344)

Create a bash security hook with a custom allowlist.

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `allowedCommands` | `Set`\<`string`\> | `DEFAULT_ALLOWED_COMMANDS` | Set of allowed command names (defaults to DEFAULT_ALLOWED_COMMANDS) |

#### Returns

[`SecurityHook`](#securityhook)

Security hook function

***

### createCustomHarness()

```ts
function createCustomHarness(options): AgentHarness;
```

Defined in: [packages/agent-core/src/harnesses/custom.ts:88](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/harnesses/custom.ts#L88)

Create a custom agent harness.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`CustomHarnessOptions`](#customharnessoptions) | Harness configuration options |

#### Returns

[`AgentHarness`](#agentharness)

A configured AgentHarness

#### Example

```typescript
const researchHarness = createCustomHarness({
  id: 'research',
  name: 'Deep Research',
  description: 'Conduct multi-hour research on a topic',
  initializerPrompt: 'You are a research agent...',
  continuationPrompt: 'Continue your research...',
  allowedCommands: ['curl', 'wget', 'cat', 'grep'],
  mcpServers: [
    { name: 'web-search', command: 'npx', args: ['web-search-mcp'] }
  ],
});
```

***

### createEvent()

```ts
function createEvent<T>(buildId, event): T;
```

Defined in: [packages/agent-core/src/events.ts:300](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/events.ts#L300)

Create a new event with common fields populated

#### Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`AgentEvent`](#agentevent) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `buildId` | `string` |
| `event` | `Omit`\<`T`, `"id"` \| `"timestamp"` \| `"buildId"`\> |

#### Returns

`T`

***

### createPromptProvider()

```ts
function createPromptProvider(overrides?): object;
```

Defined in: [packages/agent-core/src/prompts.ts:741](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/prompts.ts#L741)

Create a prompt provider with optional overrides.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `overrides?` | [`PromptOverrides`](#promptoverrides) |

#### Returns

`object`

| Name | Type |
| ------ | ------ |
| `getCodingPrompt()` | () => `string` |
| `getInitializerPrompt()` | () => `string` |
| `getPromptForSession()` | (`isFirstSession`) => `string` |

***

### extendCodingHarness()

```ts
function extendCodingHarness(overrides): AgentHarness;
```

Defined in: [packages/agent-core/src/harnesses/custom.ts:129](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/harnesses/custom.ts#L129)

Extend the default coding harness with custom modifications.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `overrides` | `Partial`\<[`CustomHarnessOptions`](#customharnessoptions)\> | Partial harness options to override defaults |

#### Returns

[`AgentHarness`](#agentharness)

A new harness based on the coding harness

#### Example

```typescript
const pythonHarness = extendCodingHarness({
  id: 'python-coding',
  name: 'Python Development',
  allowedCommands: [...CODING_ALLOWED_COMMANDS, 'python', 'pip', 'pytest'],
});
```

***

### extractCommands()

```ts
function extractCommands(commandString): string[];
```

Defined in: [packages/agent-core/src/security.ts:144](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/security.ts#L144)

Extract command names from a shell command string.
Handles pipes, command chaining (&&, ||, ;), and subshells.
Returns the base command names (without paths).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `commandString` | `string` |

#### Returns

`string`[]

***

### featureListToProgressState()

```ts
function featureListToProgressState(features): ProgressState;
```

Defined in: [packages/agent-core/src/progress.ts:74](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/progress.ts#L74)

Convert feature list to ProgressState format.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `features` | [`FeatureListItem`](#featurelistitem)[] |

#### Returns

[`ProgressState`](#progressstate)

***

### formatDuration()

```ts
function formatDuration(ms): string;
```

Defined in: [packages/agent-core/src/events.ts:344](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/events.ts#L344)

Format duration for display

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ms` | `number` |

#### Returns

`string`

***

### formatProgressSummary()

```ts
function formatProgressSummary(passing, total): string;
```

Defined in: [packages/agent-core/src/progress.ts:138](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/progress.ts#L138)

Format a progress summary string.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `passing` | `number` |
| `total` | `number` |

#### Returns

`string`

***

### formatProgressSummaryFromState()

```ts
function formatProgressSummaryFromState(state): string;
```

Defined in: [packages/agent-core/src/progress.ts:150](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/progress.ts#L150)

Format progress summary from ProgressState.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | [`ProgressState`](#progressstate) |

#### Returns

`string`

***

### formatSessionHeader()

```ts
function formatSessionHeader(sessionNum, isInitializer): string;
```

Defined in: [packages/agent-core/src/progress.ts:124](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/progress.ts#L124)

Format a session header string.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionNum` | `number` |
| `isInitializer` | `boolean` |

#### Returns

`string`

***

### generateEventId()

```ts
function generateEventId(): string;
```

Defined in: [packages/agent-core/src/events.ts:293](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/events.ts#L293)

Generate a unique event ID

#### Returns

`string`

***

### getActivityLabel()

```ts
function getActivityLabel(activity): string;
```

Defined in: [packages/agent-core/src/events.ts:355](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/events.ts#L355)

Get a human-readable description for an activity

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `activity` | [`ActivityType`](#activitytype) |

#### Returns

`string`

***

### getCodingPrompt()

```ts
function getCodingPrompt(): string;
```

Defined in: [packages/agent-core/src/prompts.ts:716](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/prompts.ts#L716)

Get the coding agent prompt.

#### Returns

`string`

***

### getEventCategory()

```ts
function getEventCategory(event): EventCategory;
```

Defined in: [packages/agent-core/src/events.ts:257](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/events.ts#L257)

Get the category for an event type

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | [`AgentEvent`](#agentevent) |

#### Returns

[`EventCategory`](#eventcategory)

***

### getInitializerPrompt()

```ts
function getInitializerPrompt(targetFeatures): string;
```

Defined in: [packages/agent-core/src/prompts.ts:592](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/prompts.ts#L592)

Get the initializer prompt with dynamic feature count.
This is the primary way to get the initializer prompt.

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `targetFeatures` | `number` | `80` |

#### Returns

`string`

***

### ~~getLegacyInitializerPrompt()~~

```ts
function getLegacyInitializerPrompt(): string;
```

Defined in: [packages/agent-core/src/prompts.ts:709](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/prompts.ts#L709)

Get the legacy initializer prompt (with hardcoded 200 features).

#### Returns

`string`

#### Deprecated

Use getInitializerPrompt(targetFeatures) instead

***

### getProgressFromFeatureList()

```ts
function getProgressFromFeatureList(content): ProgressState;
```

Defined in: [packages/agent-core/src/progress.ts:96](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/progress.ts#L96)

Get progress state from feature_list.json content.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `content` | `string` |

#### Returns

[`ProgressState`](#progressstate)

***

### getProgressFromSandbox()

```ts
function getProgressFromSandbox(sandbox): Promise<ProgressState>;
```

Defined in: [packages/agent-core/src/progress.ts:104](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/progress.ts#L104)

Get progress state from a sandbox.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sandbox` | [`Sandbox`](#sandbox) |

#### Returns

`Promise`\<[`ProgressState`](#progressstate)\>

***

### getPromptForSession()

```ts
function getPromptForSession(isFirstSession, targetFeatures): string;
```

Defined in: [packages/agent-core/src/prompts.ts:725](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/prompts.ts#L725)

Get the appropriate prompt based on whether this is the first session.

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `isFirstSession` | `boolean` | `undefined` | Whether this is the first session |
| `targetFeatures` | `number` | `80` | Target number of features (used for first session) |

#### Returns

`string`

***

### inferLanguage()

```ts
function inferLanguage(path): string | undefined;
```

Defined in: [packages/agent-core/src/events.ts:315](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/events.ts#L315)

Infer programming language from file extension

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

`string` \| `undefined`

***

### isComplete()

```ts
function isComplete(features): boolean;
```

Defined in: [packages/agent-core/src/progress.ts:161](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/progress.ts#L161)

Check if all features are passing.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `features` | [`FeatureListItem`](#featurelistitem)[] |

#### Returns

`boolean`

***

### isCompleteFromSandbox()

```ts
function isCompleteFromSandbox(sandbox): Promise<boolean>;
```

Defined in: [packages/agent-core/src/progress.ts:171](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/progress.ts#L171)

Check if the project is complete by reading feature_list.json from sandbox.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sandbox` | [`Sandbox`](#sandbox) |

#### Returns

`Promise`\<`boolean`\>

***

### parseFeatureList()

```ts
function parseFeatureList(content): FeatureListItem[];
```

Defined in: [packages/agent-core/src/progress.ts:29](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/progress.ts#L29)

Parse the feature_list.json content into FeatureListItem array.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `content` | `string` |

#### Returns

[`FeatureListItem`](#featurelistitem)[]

***

### runAgentInSandbox()

```ts
function runAgentInSandbox(options): Promise<void>;
```

Defined in: [packages/agent-core/src/agent.ts:384](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/agent.ts#L384)

Run the autonomous agent in a sandbox environment.
This is the primary entry point for web-based execution.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`SandboxAgentOptions`](#sandboxagentoptions) | Sandbox agent options |

#### Returns

`Promise`\<`void`\>

***

### runAgentSession()

```ts
function runAgentSession(config, message): Promise<SessionResult>;
```

Defined in: [packages/agent-core/src/agent.ts:94](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/agent.ts#L94)

Run a single agent session using Claude Agent SDK.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config` | [`AgentSessionConfig`](#agentsessionconfig) | Session configuration |
| `message` | `string` | The prompt to send |

#### Returns

`Promise`\<[`SessionResult`](#sessionresult)\>

Session result with status and response

***

### runAutonomousAgent()

```ts
function runAutonomousAgent(options): Promise<void>;
```

Defined in: [packages/agent-core/src/agent.ts:239](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/agent.ts#L239)

Run the autonomous agent loop.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`RunAgentOptions`](#runagentoptions) | Agent run options |

#### Returns

`Promise`\<`void`\>

***

### splitCommandSegments()

```ts
function splitCommandSegments(commandString): string[];
```

Defined in: [packages/agent-core/src/security.ts:62](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/security.ts#L62)

Split a compound command into individual command segments.
Handles command chaining (&&, ||, ;) but not pipes (those are single commands).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `commandString` | `string` |

#### Returns

`string`[]

***

### tokenizeCommand()

```ts
function tokenizeCommand(command): string[];
```

Defined in: [packages/agent-core/src/security.ts:85](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/security.ts#L85)

Simple shell-like tokenization.
Handles quoted strings and basic escaping.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `command` | `string` |

#### Returns

`string`[]

***

### validateChmodCommand()

```ts
function validateChmodCommand(commandString): object;
```

Defined in: [packages/agent-core/src/security.ts:261](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/security.ts#L261)

Validate chmod commands - only allow making files executable with +x.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `commandString` | `string` |

#### Returns

`object`

| Name | Type |
| ------ | ------ |
| `allowed` | `boolean` |
| `reason` | `string` |

***

### validateInitScript()

```ts
function validateInitScript(commandString): object;
```

Defined in: [packages/agent-core/src/security.ts:303](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/security.ts#L303)

Validate init.sh script execution - only allow ./init.sh.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `commandString` | `string` |

#### Returns

`object`

| Name | Type |
| ------ | ------ |
| `allowed` | `boolean` |
| `reason` | `string` |

***

### validatePkillCommand()

```ts
function validatePkillCommand(commandString): object;
```

Defined in: [packages/agent-core/src/security.ts:225](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/agent-core/src/security.ts#L225)

Validate pkill commands - only allow killing dev-related processes.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `commandString` | `string` |

#### Returns

`object`

| Name | Type |
| ------ | ------ |
| `allowed` | `boolean` |
| `reason` | `string` |
