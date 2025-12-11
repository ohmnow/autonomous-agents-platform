# Phase 5: Non-Code Workflows

**Status:** Future Planning  
**Priority:** Medium-Low (Strategic)  
**Estimated Duration:** 3-4 weeks  
**Dependencies:** Phase 1 (Template Foundation)

---

## Objective

Enable autonomous agents to perform non-coding tasks for knowledge workers: email triage, calendar management, research, data processing, and custom automation.

---

## Vision

> "The same autonomous approach that builds apps can also run your workflows."

Instead of building an app, users describe a workflow:
- "Triage my inbox and flag important emails"
- "Research competitors and create a report"
- "Process these CSVs and generate summaries"
- "Monitor this API and alert me on changes"

---

## Architecture

### Claude Code Template

Pre-configured sandbox with Claude Code CLI:

```typescript
// templates/claude-code/template.ts
export const template = Template()
  .fromNodeImage('24')
  .aptInstall(['curl', 'git', 'ripgrep', 'jq', 'python3', 'python3-pip'])
  .npmInstall('@anthropic-ai/claude-code@latest', { g: true })
  .pipInstall(['pandas', 'requests', 'beautifulsoup4', 'google-api-python-client'])
  .setWorkdir('/home/user/workspace')
  .setEnvs({
    ANTHROPIC_API_KEY: '${ANTHROPIC_API_KEY}',
  });
```

### MCP Gateway Integration

Access to 200+ external tools via E2B's MCP Gateway:

```typescript
const sandbox = await Sandbox.create({
  mcp: {
    gmail: { credentials: userGmailCreds },
    gcalendar: { credentials: userCalendarCreds },
    notion: { apiKey: userNotionKey },
    slack: { token: userSlackToken },
  },
});
```

### Workflow Types

| Workflow | Description | MCP Servers |
|----------|-------------|-------------|
| Email Triage | Sort, label, draft responses | gmail |
| Calendar Manager | Schedule, reschedule, prep | gcalendar |
| Research Agent | Search, synthesize, report | exa, browserbase |
| Data Processor | ETL, analysis, visualization | filesystem, databases |
| API Monitor | Watch endpoints, alert on changes | http, slack |

---

## User Experience

### Workflow Builder

```
1. Select workflow type (or describe custom)
2. Connect required services (OAuth)
3. Configure rules/preferences
4. Set schedule (one-time, recurring)
5. Launch and monitor
```

### Workflow Definition

```typescript
interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  
  // Services needed
  requiredConnections: ('gmail' | 'gcalendar' | 'notion' | 'slack')[];
  
  // Execution
  trigger: 'manual' | 'scheduled' | 'webhook';
  schedule?: string; // cron expression
  
  // The actual task
  prompt: string;
  
  // Output
  outputFormat: 'report' | 'notifications' | 'file' | 'api';
}
```

### Example: Email Triage Workflow

```typescript
const emailTriageWorkflow: WorkflowDefinition = {
  id: 'email-triage',
  name: 'Daily Email Triage',
  description: 'Review inbox, categorize, and draft responses',
  
  requiredConnections: ['gmail'],
  
  trigger: 'scheduled',
  schedule: '0 8 * * 1-5', // 8 AM weekdays
  
  prompt: `
    Review my unread emails from the last 24 hours.
    
    For each email:
    1. Categorize: urgent, action-needed, informational, can-wait, spam
    2. If urgent or action-needed, draft a brief response
    3. Label appropriately in Gmail
    
    Create a summary report with:
    - Count by category
    - Top 3 urgent items
    - Suggested responses for action items
    
    Save report to /output/email-triage-{date}.md
  `,
  
  outputFormat: 'report',
};
```

---

## Implementation Phases

### 5.1: Claude Code Template
- [ ] Create claude-code template
- [ ] Test Claude Code CLI in sandbox
- [ ] Basic workflow execution

### 5.2: MCP Gateway Integration
- [ ] Set up MCP Gateway configuration
- [ ] OAuth flows for common services
- [ ] Secure credential storage

### 5.3: Workflow Builder UI
- [ ] Workflow type selection
- [ ] Service connection UI
- [ ] Schedule configuration
- [ ] Execution monitoring

### 5.4: Workflow Templates
- [ ] Email triage template
- [ ] Calendar manager template
- [ ] Research agent template
- [ ] Custom workflow support

---

## Security Considerations

1. **OAuth Credentials**
   - Stored encrypted
   - Scoped permissions
   - User can revoke anytime

2. **Sandbox Isolation**
   - Each workflow runs in isolated sandbox
   - No cross-workflow data access
   - Credentials injected at runtime

3. **Data Handling**
   - Outputs stored in user's storage
   - No data retained after workflow
   - Audit log of actions taken

---

## Success Criteria

| Feature | Verified |
|---------|----------|
| Claude Code workflow execution | ⬜ |
| Gmail integration working | ⬜ |
| Calendar integration working | ⬜ |
| Scheduled workflow runs | ⬜ |
| Workflow output saved | ⬜ |
| User can create custom workflow | ⬜ |

---

## Future Possibilities

- **Multi-step workflows**: Chain multiple agents
- **Approval gates**: Human-in-the-loop for critical actions
- **Learning**: Workflows improve from feedback
- **Marketplace**: Share/sell workflow templates

---

## Next Phase

[Phase 6: Extended Platforms](./06-phase-extended-platforms.md)
