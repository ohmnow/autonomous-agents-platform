# Phase 6: Extended Platforms

**Status:** Future Planning  
**Priority:** Low (Long-term)  
**Estimated Duration:** Ongoing  
**Dependencies:** Phases 1-4

---

## Objective

Extend the autonomous building capability beyond web applications to mobile, desktop, APIs, and browser extensions.

---

## Platform Roadmap

### 6.1: Mobile Apps (React Native / Expo)

**Template:** `expo-mobile`

```typescript
export const template = Template()
  .fromNodeImage('21')
  .aptInstall(['openjdk-17-jdk', 'android-sdk'])
  .runCmd('npx create-expo-app . --template blank-typescript')
  .runCmd('npx expo install expo-router react-native-paper')
  // ...
```

**Challenges:**
- Emulator in sandbox (performance)
- iOS builds require macOS
- App store submission

**Approach:**
- Use Expo EAS for builds
- Preview via Expo Go
- Web export for quick testing

---

### 6.2: Desktop Apps (Electron / Tauri)

**Template:** `electron-desktop` or `tauri-desktop`

**Challenges:**
- Platform-specific builds
- Native dependencies
- Testing without display

**Approach:**
- Tauri preferred (Rust, smaller)
- Web preview first
- Platform builds via CI

---

### 6.3: API Services

**Template:** `api-hono` or `api-express`

```typescript
export const template = Template()
  .fromNodeImage('21')
  .runCmd('npm init -y')
  .runCmd('npm install hono @hono/node-server')
  .setStartCmd('node dist/index.js', waitForPort(3000));
```

**Features:**
- OpenAPI spec generation
- Database integration
- Auth middleware
- Rate limiting

---

### 6.4: Chrome Extensions

**Template:** `chrome-extension`

```typescript
export const template = Template()
  .fromNodeImage('21')
  .runCmd('npx create-chrome-ext . --template react-ts')
  // ...
```

**Challenges:**
- Testing in actual browser
- Chrome Web Store submission
- Background script complexity

---

## Implementation Strategy

Each platform follows the pattern:
1. Create specialized template
2. Add to template selection logic
3. Update wizard with platform options
4. Add platform-specific prompts
5. Test and refine

---

## Priority Order

1. **API Services** - Lower complexity, high demand
2. **Chrome Extensions** - Growing use case
3. **Mobile (Expo)** - High demand, complex
4. **Desktop** - Niche but valuable

---

## Success Criteria

| Platform | Template Created | Wizard Support | Tested |
|----------|------------------|----------------|--------|
| API (Hono) | ⬜ | ⬜ | ⬜ |
| Chrome Extension | ⬜ | ⬜ | ⬜ |
| Mobile (Expo) | ⬜ | ⬜ | ⬜ |
| Desktop (Tauri) | ⬜ | ⬜ | ⬜ |



