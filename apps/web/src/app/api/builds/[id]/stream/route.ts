import {
  subscribeToBuildUpdates,
  loadHistoricalLogs,
  loadHistoricalEvents,
  isBuildActive,
  getBuildEvents,
} from '@/lib/sandbox/build-runner';
import { getBuildById } from '@repo/database';
import { ensureUser } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Wait for build to become active (handles race condition at startup)
 * Polls every 100ms for up to 3 seconds
 */
async function waitForBuildActive(buildId: string, maxWaitMs = 3000): Promise<boolean> {
  const startTime = Date.now();
  const pollInterval = 100;
  
  while (Date.now() - startTime < maxWaitMs) {
    if (isBuildActive(buildId)) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  return isBuildActive(buildId);
}

/**
 * GET /api/builds/[id]/stream
 * Server-Sent Events stream for build logs
 *
 * Behavior:
 * - If build is active on this server: streams real-time logs
 * - If build is RUNNING but not yet active: waits briefly for it to start
 * - If build is not active: loads historical logs from database first
 * - For completed/failed builds: only sends historical logs
 */
export async function GET(request: Request, { params }: RouteParams) {
  const { id: buildId } = await params;

  let userId: string;
  try {
    const user = await ensureUser();
    userId = user.userId;
  } catch {
    return new Response('Unauthorized', { status: 401 });
  }

  // Verify build exists and user has access
  const build = await getBuildById(buildId);
  if (!build) {
    return new Response('Build not found', { status: 404 });
  }
  if (build.userId !== userId) {
    return new Response('Forbidden', { status: 403 });
  }

  const buildIsComplete = ['COMPLETED', 'FAILED', 'CANCELLED'].includes(build.status);
  
  // If build is RUNNING but not yet active in memory, wait briefly for it to start
  // This handles the race condition where client connects before startBuildInBackground runs
  let buildIsActive = isBuildActive(buildId);
  if (!buildIsActive && build.status === 'RUNNING' && !buildIsComplete) {
    buildIsActive = await waitForBuildActive(buildId);
  }

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let isClosed = false;

      // Helper to send SSE events
      const sendEvent = (data: unknown) => {
        if (isClosed) return;
        try {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch {
          // Controller might be closed
          isClosed = true;
        }
      };

      // Send initial connection event
      // Build is considered "live" if:
      // 1. It's active in memory (buildIsActive), OR
      // 2. It's in RUNNING status (means it's running somewhere, even if not in this process's memory)
      // This handles the case where the build is running but client connected before build-runner started
      const isLive = (buildIsActive || build.status === 'RUNNING') && !buildIsComplete;
      
      sendEvent({
        type: 'connected',
        buildId,
        buildStatus: build.status,
        isLive,
        // Include build startedAt time for elapsed calculation
        startedAt: build.startedAt?.toISOString() || build.createdAt.toISOString(),
        timestamp: new Date().toISOString(),
      });

      // Track the last log/event IDs we've sent (for polling deduplication)
      let lastLogId = '';
      let lastEventId = '';

      // If build is not active on this server (or is complete),
      // load historical logs and events from database first
      if (!buildIsActive || buildIsComplete) {
        const historicalLogs = await loadHistoricalLogs(buildId);
        for (const log of historicalLogs) {
          sendEvent({ type: 'log', ...log, historical: true });
          // Track last log ID for polling deduplication
          const logId = (log as { id?: string }).id || '';
          if (logId > lastLogId) lastLogId = logId;
        }
        
        // Load historical structured events from database
        const historicalEvents = await loadHistoricalEvents(buildId);
        for (const event of historicalEvents) {
          sendEvent({ ...event, historical: true });
          // Track last event ID for polling deduplication
          const eventId = (event as { id?: string }).id || '';
          if (eventId > lastEventId) lastEventId = eventId;
        }

        // If build is complete, send end event and close
        if (buildIsComplete) {
          sendEvent({
            type: 'complete',
            buildStatus: build.status,
            timestamp: new Date().toISOString(),
          });
          controller.close();
          return;
        }
      } else {
        // If build is active, send existing in-memory events
        const existingEvents = getBuildEvents(buildId);
        for (const event of existingEvents) {
          // Spread event data, keeping its 'type' field intact
          // The frontend will identify this as an agent event by checking for specific type values
          sendEvent(event);
        }
      }

      // Subscribe to real-time updates (logs and events)
      const unsubscribe = subscribeToBuildUpdates(buildId, (update) => {
        if (update.type === 'log') {
          // For logs, we send with type: 'log' for backwards compatibility
          sendEvent({ type: 'log', ...(update.data as object) });
        } else if (update.type === 'event') {
          // For agent events, just send the event data directly
          // The event already has its own 'type' field (tool_start, file_created, etc.)
          sendEvent(update.data);
        }
      });
      
      // For builds that are running but not active in this server's memory,
      // poll the database periodically for new logs and events
      let pollInterval: NodeJS.Timeout | undefined;
      if (!buildIsActive && build.status === 'RUNNING') {
        pollInterval = setInterval(async () => {
          try {
            // Reload build status to check if it's complete
            const currentBuild = await getBuildById(buildId);
            if (!currentBuild || ['COMPLETED', 'FAILED', 'CANCELLED'].includes(currentBuild.status)) {
              sendEvent({
                type: 'complete',
                buildStatus: currentBuild?.status || 'COMPLETED',
                timestamp: new Date().toISOString(),
              });
              if (pollInterval) clearInterval(pollInterval);
              controller.close();
              return;
            }
            
            // Load new logs from database (after lastLogId)
            const newLogs = await loadHistoricalLogs(buildId);
            for (const log of newLogs) {
              const logId = (log as { id?: string }).id || '';
              if (logId && logId > lastLogId) {
                sendEvent({ type: 'log', ...log });
                lastLogId = logId;
              }
            }
            
            // Load new events from database (after lastEventId)
            const newEvents = await loadHistoricalEvents(buildId);
            for (const event of newEvents) {
              const eventId = (event as { id?: string }).id || '';
              if (eventId && eventId > lastEventId) {
                sendEvent({ ...event });
                lastEventId = eventId;
              }
            }
          } catch (error) {
            console.error('Error polling for updates:', error);
          }
        }, 3000); // Poll every 3 seconds
      }

      // Send heartbeat every 15 seconds to keep connection alive
      const heartbeatInterval = setInterval(() => {
        sendEvent({ type: 'heartbeat', timestamp: new Date().toISOString() });
      }, 15000);

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        isClosed = true;
        clearInterval(heartbeatInterval);
        if (pollInterval) clearInterval(pollInterval);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering in nginx
    },
  });
}
