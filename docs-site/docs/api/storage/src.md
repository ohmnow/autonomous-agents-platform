[**Autonomous Agents Platform API**](../index.md)

***

[Autonomous Agents Platform API](../index.md) / storage/src

# storage/src

## Classes

### LocalProvider

Defined in: [packages/storage/src/local-provider.ts:29](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/local-provider.ts#L29)

@repo/storage

Unified storage abstraction layer for the Autonomous Agents Platform.

Supports:
- MinIO (local development)
- AWS S3 (production)
- Cloudflare R2 (production)
- Local filesystem (fallback)

#### Example

```typescript
import { getStorage } from '@repo/storage';

const storage = getStorage();

// Upload a file
await storage.upload('builds/123/artifacts.zip', zipBuffer, {
  contentType: 'application/zip',
});

// Get a download URL
const url = await storage.getSignedUrl('builds/123/artifacts.zip');

// Download directly
const { data, contentType } = await storage.download('builds/123/artifacts.zip');
```

#### Implements

- [`StorageProvider`](#storageprovider)

#### Constructors

##### Constructor

```ts
new LocalProvider(config): LocalProvider;
```

Defined in: [packages/storage/src/local-provider.ts:33](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/local-provider.ts#L33)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `config` | [`LocalStorageConfig`](#localstorageconfig) |

###### Returns

[`LocalProvider`](#localprovider)

#### Methods

##### delete()

```ts
delete(key): Promise<void>;
```

Defined in: [packages/storage/src/local-provider.ts:125](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/local-provider.ts#L125)

Delete a file from storage

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The storage key (path) of the file |

###### Returns

`Promise`\<`void`\>

###### Implementation of

[`StorageProvider`](#storageprovider).[`delete`](#delete-4)

##### download()

```ts
download(key): Promise<DownloadResult>;
```

Defined in: [packages/storage/src/local-provider.ts:75](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/local-provider.ts#L75)

Download a file from storage

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The storage key (path) of the file |

###### Returns

`Promise`\<[`DownloadResult`](#downloadresult)\>

The file content and metadata

###### Implementation of

[`StorageProvider`](#storageprovider).[`download`](#download-4)

##### exists()

```ts
exists(key): Promise<boolean>;
```

Defined in: [packages/storage/src/local-provider.ts:144](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/local-provider.ts#L144)

Check if a file exists in storage

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The storage key (path) of the file |

###### Returns

`Promise`\<`boolean`\>

True if the file exists

###### Implementation of

[`StorageProvider`](#storageprovider).[`exists`](#exists-4)

##### getInfo()

```ts
getInfo(key): Promise<FileInfo | null>;
```

Defined in: [packages/storage/src/local-provider.ts:154](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/local-provider.ts#L154)

Get file metadata without downloading

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The storage key (path) of the file |

###### Returns

`Promise`\<[`FileInfo`](#fileinfo) \| `null`\>

File info or null if not found

###### Implementation of

[`StorageProvider`](#storageprovider).[`getInfo`](#getinfo-4)

##### getSignedUploadUrl()

```ts
getSignedUploadUrl(
   key, 
   _expiresIn?, 
_options?): Promise<string>;
```

Defined in: [packages/storage/src/local-provider.ts:115](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/local-provider.ts#L115)

Get a pre-signed URL for uploading a file

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The storage key (path) for the file |
| `_expiresIn?` | `number` | - |
| `_options?` | [`UploadOptions`](#uploadoptions) | - |

###### Returns

`Promise`\<`string`\>

A pre-signed URL that allows temporary upload access

###### Implementation of

[`StorageProvider`](#storageprovider).[`getSignedUploadUrl`](#getsigneduploadurl-4)

##### getSignedUrl()

```ts
getSignedUrl(key, _expiresIn?): Promise<string>;
```

Defined in: [packages/storage/src/local-provider.ts:105](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/local-provider.ts#L105)

Get a pre-signed URL for downloading a file

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The storage key (path) of the file |
| `_expiresIn?` | `number` | - |

###### Returns

`Promise`\<`string`\>

A pre-signed URL that allows temporary access

###### Implementation of

[`StorageProvider`](#storageprovider).[`getSignedUrl`](#getsignedurl-4)

##### list()

```ts
list(options?): Promise<ListResult>;
```

Defined in: [packages/storage/src/local-provider.ts:184](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/local-provider.ts#L184)

List files in storage

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`ListOptions`](#listoptions) | List options (prefix, pagination) |

###### Returns

`Promise`\<[`ListResult`](#listresult)\>

List of files and pagination info

###### Implementation of

[`StorageProvider`](#storageprovider).[`list`](#list-4)

##### upload()

```ts
upload(
   key, 
   data, 
options?): Promise<string>;
```

Defined in: [packages/storage/src/local-provider.ts:48](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/local-provider.ts#L48)

Upload a file to storage

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The storage key (path) for the file |
| `data` | `Buffer` | The file content as Buffer |
| `options?` | [`UploadOptions`](#uploadoptions) | Upload options (content type, metadata) |

###### Returns

`Promise`\<`string`\>

The storage key

###### Implementation of

[`StorageProvider`](#storageprovider).[`upload`](#upload-4)

***

### S3Provider

Defined in: [packages/storage/src/s3-provider.ts:31](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/s3-provider.ts#L31)

@repo/storage

Unified storage abstraction layer for the Autonomous Agents Platform.

Supports:
- MinIO (local development)
- AWS S3 (production)
- Cloudflare R2 (production)
- Local filesystem (fallback)

#### Example

```typescript
import { getStorage } from '@repo/storage';

const storage = getStorage();

// Upload a file
await storage.upload('builds/123/artifacts.zip', zipBuffer, {
  contentType: 'application/zip',
});

// Get a download URL
const url = await storage.getSignedUrl('builds/123/artifacts.zip');

// Download directly
const { data, contentType } = await storage.download('builds/123/artifacts.zip');
```

#### Implements

- [`StorageProvider`](#storageprovider)

#### Constructors

##### Constructor

```ts
new S3Provider(config): S3Provider;
```

Defined in: [packages/storage/src/s3-provider.ts:35](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/s3-provider.ts#L35)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `config` | [`StorageConfig`](#storageconfig) |

###### Returns

[`S3Provider`](#s3provider)

#### Methods

##### delete()

```ts
delete(key): Promise<void>;
```

Defined in: [packages/storage/src/s3-provider.ts:116](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/s3-provider.ts#L116)

Delete a file from storage

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The storage key (path) of the file |

###### Returns

`Promise`\<`void`\>

###### Implementation of

[`StorageProvider`](#storageprovider).[`delete`](#delete-4)

##### download()

```ts
download(key): Promise<DownloadResult>;
```

Defined in: [packages/storage/src/s3-provider.ts:66](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/s3-provider.ts#L66)

Download a file from storage

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The storage key (path) of the file |

###### Returns

`Promise`\<[`DownloadResult`](#downloadresult)\>

The file content and metadata

###### Implementation of

[`StorageProvider`](#storageprovider).[`download`](#download-4)

##### exists()

```ts
exists(key): Promise<boolean>;
```

Defined in: [packages/storage/src/s3-provider.ts:125](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/s3-provider.ts#L125)

Check if a file exists in storage

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The storage key (path) of the file |

###### Returns

`Promise`\<`boolean`\>

True if the file exists

###### Implementation of

[`StorageProvider`](#storageprovider).[`exists`](#exists-4)

##### getInfo()

```ts
getInfo(key): Promise<FileInfo | null>;
```

Defined in: [packages/storage/src/s3-provider.ts:130](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/s3-provider.ts#L130)

Get file metadata without downloading

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The storage key (path) of the file |

###### Returns

`Promise`\<[`FileInfo`](#fileinfo) \| `null`\>

File info or null if not found

###### Implementation of

[`StorageProvider`](#storageprovider).[`getInfo`](#getinfo-4)

##### getSignedUploadUrl()

```ts
getSignedUploadUrl(
   key, 
   expiresIn, 
options?): Promise<string>;
```

Defined in: [packages/storage/src/s3-provider.ts:102](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/s3-provider.ts#L102)

Get a pre-signed URL for uploading a file

###### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `key` | `string` | `undefined` | The storage key (path) for the file |
| `expiresIn` | `number` | `3600` | URL expiration time in seconds (default: 3600 = 1 hour) |
| `options?` | [`UploadOptions`](#uploadoptions) | `undefined` | Upload options (content type) |

###### Returns

`Promise`\<`string`\>

A pre-signed URL that allows temporary upload access

###### Implementation of

[`StorageProvider`](#storageprovider).[`getSignedUploadUrl`](#getsigneduploadurl-4)

##### getSignedUrl()

```ts
getSignedUrl(key, expiresIn): Promise<string>;
```

Defined in: [packages/storage/src/s3-provider.ts:93](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/s3-provider.ts#L93)

Get a pre-signed URL for downloading a file

###### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `key` | `string` | `undefined` | The storage key (path) of the file |
| `expiresIn` | `number` | `3600` | URL expiration time in seconds (default: 3600 = 1 hour) |

###### Returns

`Promise`\<`string`\>

A pre-signed URL that allows temporary access

###### Implementation of

[`StorageProvider`](#storageprovider).[`getSignedUrl`](#getsignedurl-4)

##### list()

```ts
list(options?): Promise<ListResult>;
```

Defined in: [packages/storage/src/s3-provider.ts:162](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/s3-provider.ts#L162)

List files in storage

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`ListOptions`](#listoptions) | List options (prefix, pagination) |

###### Returns

`Promise`\<[`ListResult`](#listresult)\>

List of files and pagination info

###### Implementation of

[`StorageProvider`](#storageprovider).[`list`](#list-4)

##### upload()

```ts
upload(
   key, 
   data, 
options?): Promise<string>;
```

Defined in: [packages/storage/src/s3-provider.ts:49](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/s3-provider.ts#L49)

Upload a file to storage

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The storage key (path) for the file |
| `data` | `Buffer` | The file content as Buffer |
| `options?` | [`UploadOptions`](#uploadoptions) | Upload options (content type, metadata) |

###### Returns

`Promise`\<`string`\>

The storage key

###### Implementation of

[`StorageProvider`](#storageprovider).[`upload`](#upload-4)

## Interfaces

### DownloadResult

Defined in: [packages/storage/src/interface.ts:19](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/interface.ts#L19)

@repo/storage

Unified storage abstraction layer for the Autonomous Agents Platform.

Supports:
- MinIO (local development)
- AWS S3 (production)
- Cloudflare R2 (production)
- Local filesystem (fallback)

#### Example

```typescript
import { getStorage } from '@repo/storage';

const storage = getStorage();

// Upload a file
await storage.upload('builds/123/artifacts.zip', zipBuffer, {
  contentType: 'application/zip',
});

// Get a download URL
const url = await storage.getSignedUrl('builds/123/artifacts.zip');

// Download directly
const { data, contentType } = await storage.download('builds/123/artifacts.zip');
```

#### Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="contenttype"></a> `contentType?` | `string` | MIME type if available |
| <a id="data"></a> `data` | `Buffer` | File content as Buffer |
| <a id="size"></a> `size` | `number` | File size in bytes |

***

### FileInfo

Defined in: [packages/storage/src/interface.ts:28](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/interface.ts#L28)

@repo/storage

Unified storage abstraction layer for the Autonomous Agents Platform.

Supports:
- MinIO (local development)
- AWS S3 (production)
- Cloudflare R2 (production)
- Local filesystem (fallback)

#### Example

```typescript
import { getStorage } from '@repo/storage';

const storage = getStorage();

// Upload a file
await storage.upload('builds/123/artifacts.zip', zipBuffer, {
  contentType: 'application/zip',
});

// Get a download URL
const url = await storage.getSignedUrl('builds/123/artifacts.zip');

// Download directly
const { data, contentType } = await storage.download('builds/123/artifacts.zip');
```

#### Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="contenttype-1"></a> `contentType?` | `string` | MIME type if available |
| <a id="key"></a> `key` | `string` | Storage key |
| <a id="lastmodified"></a> `lastModified` | `Date` | Last modified date |
| <a id="size-1"></a> `size` | `number` | File size in bytes |

***

### ListOptions

Defined in: [packages/storage/src/interface.ts:39](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/interface.ts#L39)

@repo/storage

Unified storage abstraction layer for the Autonomous Agents Platform.

Supports:
- MinIO (local development)
- AWS S3 (production)
- Cloudflare R2 (production)
- Local filesystem (fallback)

#### Example

```typescript
import { getStorage } from '@repo/storage';

const storage = getStorage();

// Upload a file
await storage.upload('builds/123/artifacts.zip', zipBuffer, {
  contentType: 'application/zip',
});

// Get a download URL
const url = await storage.getSignedUrl('builds/123/artifacts.zip');

// Download directly
const { data, contentType } = await storage.download('builds/123/artifacts.zip');
```

#### Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="continuationtoken"></a> `continuationToken?` | `string` | Continuation token for pagination |
| <a id="maxkeys"></a> `maxKeys?` | `number` | Maximum number of results |
| <a id="prefix"></a> `prefix?` | `string` | Prefix to filter keys |

***

### ListResult

Defined in: [packages/storage/src/interface.ts:48](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/interface.ts#L48)

@repo/storage

Unified storage abstraction layer for the Autonomous Agents Platform.

Supports:
- MinIO (local development)
- AWS S3 (production)
- Cloudflare R2 (production)
- Local filesystem (fallback)

#### Example

```typescript
import { getStorage } from '@repo/storage';

const storage = getStorage();

// Upload a file
await storage.upload('builds/123/artifacts.zip', zipBuffer, {
  contentType: 'application/zip',
});

// Get a download URL
const url = await storage.getSignedUrl('builds/123/artifacts.zip');

// Download directly
const { data, contentType } = await storage.download('builds/123/artifacts.zip');
```

#### Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="files"></a> `files` | [`FileInfo`](#fileinfo)[] | Array of file info |
| <a id="istruncated"></a> `isTruncated` | `boolean` | Whether there are more results |
| <a id="nextcontinuationtoken"></a> `nextContinuationToken?` | `string` | Token for next page, if more results exist |

***

### LocalStorageConfig

Defined in: [packages/storage/src/local-provider.ts:22](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/local-provider.ts#L22)

#### Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="basepath"></a> `basePath` | `string` | Base directory for storage |
| <a id="baseurl"></a> `baseUrl?` | `string` | Base URL for generating "signed" URLs (defaults to file:// protocol) |

***

### StorageConfig

Defined in: [packages/storage/src/interface.ts:126](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/interface.ts#L126)

Storage configuration

#### Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="accesskeyid"></a> `accessKeyId` | `string` | Access key ID |
| <a id="bucket"></a> `bucket` | `string` | Bucket name |
| <a id="endpoint"></a> `endpoint?` | `string` | S3-compatible endpoint URL (required for MinIO/R2, optional for AWS S3) |
| <a id="forcepathstyle"></a> `forcePathStyle?` | `boolean` | Force path-style URLs (required for MinIO) |
| <a id="region"></a> `region` | `string` | AWS region (required for AWS S3) |
| <a id="secretaccesskey"></a> `secretAccessKey` | `string` | Secret access key |

***

### StorageProvider

Defined in: [packages/storage/src/interface.ts:57](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/interface.ts#L57)

@repo/storage

Unified storage abstraction layer for the Autonomous Agents Platform.

Supports:
- MinIO (local development)
- AWS S3 (production)
- Cloudflare R2 (production)
- Local filesystem (fallback)

#### Example

```typescript
import { getStorage } from '@repo/storage';

const storage = getStorage();

// Upload a file
await storage.upload('builds/123/artifacts.zip', zipBuffer, {
  contentType: 'application/zip',
});

// Get a download URL
const url = await storage.getSignedUrl('builds/123/artifacts.zip');

// Download directly
const { data, contentType } = await storage.download('builds/123/artifacts.zip');
```

#### Methods

##### delete()

```ts
delete(key): Promise<void>;
```

Defined in: [packages/storage/src/interface.ts:99](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/interface.ts#L99)

Delete a file from storage

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The storage key (path) of the file |

###### Returns

`Promise`\<`void`\>

##### download()

```ts
download(key): Promise<DownloadResult>;
```

Defined in: [packages/storage/src/interface.ts:72](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/interface.ts#L72)

Download a file from storage

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The storage key (path) of the file |

###### Returns

`Promise`\<[`DownloadResult`](#downloadresult)\>

The file content and metadata

##### exists()

```ts
exists(key): Promise<boolean>;
```

Defined in: [packages/storage/src/interface.ts:106](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/interface.ts#L106)

Check if a file exists in storage

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The storage key (path) of the file |

###### Returns

`Promise`\<`boolean`\>

True if the file exists

##### getInfo()

```ts
getInfo(key): Promise<FileInfo | null>;
```

Defined in: [packages/storage/src/interface.ts:113](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/interface.ts#L113)

Get file metadata without downloading

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The storage key (path) of the file |

###### Returns

`Promise`\<[`FileInfo`](#fileinfo) \| `null`\>

File info or null if not found

##### getSignedUploadUrl()

```ts
getSignedUploadUrl(
   key, 
   expiresIn?, 
options?): Promise<string>;
```

Defined in: [packages/storage/src/interface.ts:89](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/interface.ts#L89)

Get a pre-signed URL for uploading a file

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The storage key (path) for the file |
| `expiresIn?` | `number` | URL expiration time in seconds (default: 3600 = 1 hour) |
| `options?` | [`UploadOptions`](#uploadoptions) | Upload options (content type) |

###### Returns

`Promise`\<`string`\>

A pre-signed URL that allows temporary upload access

##### getSignedUrl()

```ts
getSignedUrl(key, expiresIn?): Promise<string>;
```

Defined in: [packages/storage/src/interface.ts:80](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/interface.ts#L80)

Get a pre-signed URL for downloading a file

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The storage key (path) of the file |
| `expiresIn?` | `number` | URL expiration time in seconds (default: 3600 = 1 hour) |

###### Returns

`Promise`\<`string`\>

A pre-signed URL that allows temporary access

##### list()

```ts
list(options?): Promise<ListResult>;
```

Defined in: [packages/storage/src/interface.ts:120](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/interface.ts#L120)

List files in storage

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`ListOptions`](#listoptions) | List options (prefix, pagination) |

###### Returns

`Promise`\<[`ListResult`](#listresult)\>

List of files and pagination info

##### upload()

```ts
upload(
   key, 
   data, 
options?): Promise<string>;
```

Defined in: [packages/storage/src/interface.ts:65](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/interface.ts#L65)

Upload a file to storage

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The storage key (path) for the file |
| `data` | `Buffer` | The file content as Buffer |
| `options?` | [`UploadOptions`](#uploadoptions) | Upload options (content type, metadata) |

###### Returns

`Promise`\<`string`\>

The storage key

***

### UploadOptions

Defined in: [packages/storage/src/interface.ts:12](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/interface.ts#L12)

Storage Provider Interface

Defines a unified interface for object storage that works with:
- MinIO (local development)
- AWS S3 (production option)
- Cloudflare R2 (production option)

All providers use the S3-compatible API.

#### Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="contenttype-2"></a> `contentType?` | `string` | MIME type of the file |
| <a id="metadata"></a> `metadata?` | `Record`\<`string`, `string`\> | Custom metadata |

## Type Aliases

### ProviderType

```ts
type ProviderType = "minio" | "s3" | "r2" | "local";
```

Defined in: [packages/storage/src/config.ts:20](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/config.ts#L20)

## Functions

### createStorageProvider()

```ts
function createStorageProvider(config?): StorageProvider;
```

Defined in: [packages/storage/src/config.ts:78](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/config.ts#L78)

Create a storage provider instance

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `config?` | \| [`StorageConfig`](#storageconfig) \| [`LocalStorageConfig`](#localstorageconfig) |

#### Returns

[`StorageProvider`](#storageprovider)

***

### getStorage()

```ts
function getStorage(): StorageProvider;
```

Defined in: [packages/storage/src/config.ts:101](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/config.ts#L101)

Get the global storage provider instance
Creates one if it doesn't exist

#### Returns

[`StorageProvider`](#storageprovider)

***

### getStorageConfig()

```ts
function getStorageConfig(): 
  | StorageConfig
  | LocalStorageConfig;
```

Defined in: [packages/storage/src/config.ts:55](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/config.ts#L55)

Get storage configuration from environment variables

#### Returns

  \| [`StorageConfig`](#storageconfig)
  \| [`LocalStorageConfig`](#localstorageconfig)

***

### getStorageInfo()

```ts
function getStorageInfo(): object;
```

Defined in: [packages/storage/src/config.ts:134](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/config.ts#L134)

Get information about current storage configuration

#### Returns

`object`

| Name | Type |
| ------ | ------ |
| `bucket` | `string` |
| `configured` | `boolean` |
| `endpoint?` | `string` |
| `provider` | [`ProviderType`](#providertype) |

***

### isStorageConfigured()

```ts
function isStorageConfigured(): boolean;
```

Defined in: [packages/storage/src/config.ts:118](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/config.ts#L118)

Check if storage is properly configured

#### Returns

`boolean`

***

### resetStorage()

```ts
function resetStorage(): void;
```

Defined in: [packages/storage/src/config.ts:111](https://github.com/ohmnow/autonomous-agents-platform/blob/5fc90cd9c0145f58f9eb27c2b41831cfdc769562/packages/storage/src/config.ts#L111)

Reset the storage instance (useful for testing)

#### Returns

`void`
