# App Specification Truncation Analysis & Resolution Plan

**Date:** December 10, 2024  
**Issue:** App specifications are being truncated at various points in the pipeline  
**Priority:** High  
**Estimated Fix Time:** 2-3 hours

---

## Executive Summary

After analyzing the full app specification pipeline, I've identified **5 potential truncation points** and their root causes. The main issues are:

1. **API Validation Limit** (100KB) - Likely blocking large specs from being saved
2. **Claude API max_tokens** (16384) - May truncate AI-generated specs during streaming
3. **LocalStorage Limits** (~5MB per domain) - Could truncate chat session with large specs
4. **UI Display Constraints** - Fixed height containers may appear to truncate content
5. **Database Schema** - Already uses `@db.Text` which supports unlimited text ✅

---

## Detailed Analysis

### 1. API Validation Limit (CRITICAL)

**Location:** `apps/web/src/app/api/specs/route.ts` (Line 15)

```typescript
const MAX_SPEC_SIZE = 100 * 1024; // 100KB
```

**Problem:** A detailed 2,000-line app specification could easily exceed 100KB:
- 2,000 lines × 80 characters average = 160,000 characters
- UTF-8 encoding ≈ 160KB

**Impact:** When saving specs via POST `/api/specs`, any spec over 100KB returns:
```json
{
  "error": "spec_too_large",
  "message": "Specification is too large. Maximum size is 100KB."
}
```

**Solution:** Increase limit to 1MB (reasonable for any spec):
```typescript
const MAX_SPEC_SIZE = 1 * 1024 * 1024; // 1MB
```

---

### 2. Claude API Token Limit (HIGH)

**Location:** `apps/web/src/app/api/chat/route.ts` (Lines 101-108)

```typescript
const stream = await anthropic.messages.stream({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 16384,  // Current limit
  system: SPEC_BUILDER_SYSTEM_PROMPT,
  messages: anthropicMessages,
});
```

**Problem:** 16,384 tokens is approximately 12,000-14,000 words. While generous, extremely detailed specs with code examples could hit this limit.

**Math:**
- 2,000 lines × 80 chars = 160,000 characters
- ~4 characters per token = ~40,000 tokens needed
- 16,384 tokens = ~65,000 characters = ~800 lines max

**Impact:** Claude will stop mid-response, resulting in incomplete specs missing the closing ` ``` ` marker, which causes the `extractAppSpec` function to salvage what it can but still lose content.

**Solution:** Increase to maximum reasonable limit:
```typescript
max_tokens: 32768, // 32K tokens - allows ~2,600 lines
```

Also, update system prompt to instruct Claude to be more concise if needed, or split into parts.

---

### 3. LocalStorage Limits (MEDIUM)

**Location:** `apps/web/src/hooks/use-chat.ts` (Lines 53-65)

```typescript
function saveSession(messages: Message[], spec: string) {
  if (typeof window === 'undefined') return;
  try {
    const session: ChatSession = {
      messages,
      spec,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(session));
  } catch (e) {
    console.error('Failed to save chat session:', e);  // Silent failure!
  }
}
```

**Problem:** 
- LocalStorage has a ~5MB limit per domain
- Multiple chat sessions with large specs could exceed this
- The error is caught silently, so users don't know their data wasn't saved

**Impact:** Chat sessions may fail to persist, losing conversation context and extracted specs.

**Solution:**
1. Add explicit size checking before save
2. Warn users when approaching limit
3. Consider IndexedDB for larger storage needs
4. Implement LRU cache to remove old sessions

---

### 4. UI Display Constraints (LOW)

**Location:** Multiple components

#### a. Spec Detail Page (`apps/web/src/app/(dashboard)/specs/[id]/page.tsx`)
```typescript
<pre className="max-h-[500px] overflow-auto ...">
  {spec.content}
</pre>
```
This is OK - content scrolls, not truncated.

#### b. Spec Preview (`apps/web/src/components/chat/spec-preview.tsx`)
```typescript
<div className="h-full overflow-y-auto rounded-lg bg-muted p-4">
  <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground">
    {spec}
  </pre>
</div>
```
This is OK - content scrolls, not truncated.

#### c. Edit Modal in Spec Preview
```typescript
<Textarea
  value={editedSpec}
  onChange={(e) => setEditedSpec(e.target.value)}
  className="h-[60vh] min-h-[400px] resize-none font-mono text-sm"
/>
```
This is OK - textarea scrolls.

**Conclusion:** UI is NOT truncating content, just limiting visible area with scroll.

---

### 5. Database Schema (OK ✅)

**Location:** `packages/database/prisma/schema.prisma` (Lines 85-106)

```prisma
model AppSpec {
  // ...
  content   String   @db.Text  // ✅ PostgreSQL TEXT type - unlimited length
  // ...
}

model Build {
  // ...
  appSpec   String @db.Text   // ✅ PostgreSQL TEXT type - unlimited length
  // ...
}
```

**Status:** Database schema is correctly configured with `@db.Text` which supports unlimited text in PostgreSQL. This is NOT a truncation point.

---

### 6. Spec Extraction Logic (OK ✅)

**Location:** `apps/web/src/lib/utils/extract-spec.ts`

```typescript
export function extractAppSpec(content: string): string | null {
  // Finds ```app_spec block and extracts content
  // Handles incomplete specs gracefully
  // Only returns if spec.length > 50
}
```

**Status:** This function correctly handles complete and incomplete specs. It's not truncating - it's salvaging what Claude provided.

---

## Root Cause Summary

| Location | Issue | Severity | Impact |
|----------|-------|----------|--------|
| `/api/specs` POST | 100KB limit | **CRITICAL** | Blocks saving large specs |
| `/api/chat` | 16K token limit | **HIGH** | Truncates AI-generated specs |
| `use-chat.ts` | LocalStorage silent fail | MEDIUM | Loses chat data |
| UI Components | Fixed height containers | LOW | Visual only, content scrolls |
| Database | `@db.Text` type | ✅ OK | No truncation |

---

## Resolution Plan

### Phase 1: Immediate Fixes (1-2 hours)

#### 1.1 Increase API Spec Size Limit

**File:** `apps/web/src/app/api/specs/route.ts`

```typescript
// Change from:
const MAX_SPEC_SIZE = 100 * 1024; // 100KB

// To:
const MAX_SPEC_SIZE = 1 * 1024 * 1024; // 1MB
```

Also update in PATCH endpoint if validation is added there.

#### 1.2 Increase Claude Token Limit

**File:** `apps/web/src/app/api/chat/route.ts`

```typescript
// Change from:
max_tokens: 16384,

// To:
max_tokens: 32768,
```

#### 1.3 Update System Prompt for Better Completeness

**File:** `apps/web/src/app/api/chat/route.ts`

Add to `SPEC_BUILDER_SYSTEM_PROMPT`:

```typescript
## Output Guidelines
- **IMPORTANT**: Never truncate or summarize sections
- Complete ALL sections in full detail
- If the spec would be very long, break it into logical parts
- Always finish with the closing \`\`\` marker
- Estimated minimum spec length: 500 lines for a typical app
- Include concrete implementation details, not just placeholders
```

### Phase 2: Robustness Improvements (1 hour)

#### 2.1 Add Size Warning to Chat Hook

**File:** `apps/web/src/hooks/use-chat.ts`

```typescript
const MAX_LOCAL_STORAGE_SIZE = 4 * 1024 * 1024; // 4MB warning threshold

function saveSession(messages: Message[], spec: string) {
  if (typeof window === 'undefined') return;
  
  try {
    const session: ChatSession = {
      messages,
      spec,
      updatedAt: new Date().toISOString(),
    };
    
    const serialized = JSON.stringify(session);
    
    // Warn if approaching limit
    if (serialized.length > MAX_LOCAL_STORAGE_SIZE) {
      console.warn(`Chat session is large (${Math.round(serialized.length / 1024)}KB). Consider saving to server.`);
    }
    
    localStorage.setItem(CHAT_STORAGE_KEY, serialized);
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.error('LocalStorage quota exceeded. Chat session not saved.');
      // Could trigger a toast notification here
    } else {
      console.error('Failed to save chat session:', e);
    }
  }
}
```

#### 2.2 Add Spec Size Indicator to UI

Show users how large their spec is and warn if approaching limits.

**File:** `apps/web/src/components/chat/spec-preview.tsx`

Add to the badge area:
```typescript
const specSizeKB = Math.round(spec.length / 1024);
const isSizeLarge = specSizeKB > 500; // 500KB warning

<Badge variant={isSizeLarge ? "warning" : "secondary"} className="text-xs">
  {specSizeKB} KB
</Badge>
```

### Phase 3: Documentation Updates

#### 3.1 Update env.example

Document the size limits:
```env
# Size Limits
# MAX_SPEC_SIZE - Maximum app specification size (default: 1MB)
# MAX_CHAT_TOKENS - Maximum Claude response tokens (default: 32768)
```

#### 3.2 Update Development Plan

Add this fix to the completed items in the development plan.

---

## Testing Checklist

After implementing fixes:

- [ ] Generate a spec via chat with 20+ features - verify complete
- [ ] Save a 500KB spec via API - verify no rejection
- [ ] Load and display a 2,000+ line spec - verify scrolling works
- [ ] Edit a large spec - verify textarea handles it
- [ ] Refresh page - verify localStorage persistence
- [ ] Start a build with large spec - verify full spec passed

---

## Future Considerations

1. **Chunked Spec Generation**: For extremely large apps, generate spec in sections
2. **Spec Compression**: Compress specs in localStorage using LZ-String
3. **Server-Side Storage**: Store chat sessions in database instead of localStorage
4. **Streaming Save**: Save spec incrementally as it's generated
5. **Spec Versioning**: Keep history of spec changes

---

*Last Updated: December 10, 2024*
