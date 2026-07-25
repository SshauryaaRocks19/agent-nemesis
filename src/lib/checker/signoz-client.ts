import axios from "axios";

const SIGNOZ_API_URL =
  process.env.SIGNOZ_API_URL || "https://your-signoz-instance.signoz.cloud";
const SIGNOZ_API_KEY = process.env.SIGNOZ_API_KEY;

const hdrs = () => ({
  "SIGNOZ-API-KEY": SIGNOZ_API_KEY!,
  "Content-Type": "application/json",
});

/**
 * Build a v5 filter item for a string attribute.
 */
function strFilter(key: string, value: string) {
  return {
    key: { key, type: "tag", dataType: "string", isColumn: false },
    op: "=",
    value,
  };
}

/**
 * Fetches all spans for a given conversation ID from SigNoz (v5 API).
 * Returns an array of raw span objects.
 */
export async function fetchSpansForConversation(conversationId: string) {
  if (!SIGNOZ_API_KEY) throw new Error("SIGNOZ_API_KEY is not set.");

  const nowMs = Date.now();
  const body = {
    start: nowMs - 24 * 60 * 60 * 1000,
    end: nowMs,
    requestType: "raw",
    compositeQuery: {
      queries: [
        {
          type: "builder_query",
          spec: {
            name: "A",
            signal: "traces",
            limit: 200,
            offset: 0,
            // v5 filter uses a top-level expression — omit operator wrapper, pass items
            // filter key is typed; no operator/items wrapper at top level
          },
        },
      ],
    },
  };

  const response = await axios.post(
    `${SIGNOZ_API_URL}/api/v5/query_range`,
    body,
    { headers: hdrs() }
  );

  // axios response.data is the top-level JSON body.
  // SigNoz v5 body: { status, data: { type, meta, data: { results: [{rows}] } } }
  const rows: any[] =
    response.data?.data?.data?.results?.[0]?.rows ||
    response.data?.data?.results?.[0]?.rows ||
    [];

  // Filter in JS since v5 server-side filter spec needs more investigation
  return rows.filter(
    (span: any) =>
      span?.data?.attributes?.["gen_ai.conversation.id"] === conversationId
  );
}

/**
 * Fetches distinct conversation IDs seen in the last N minutes.
 * Returns an array of conversation ID strings.
 */
export async function fetchRecentConversations(
  lookbackMinutes: number = 120
): Promise<string[]> {
  if (!SIGNOZ_API_KEY) throw new Error("SIGNOZ_API_KEY is not set.");

  const nowMs = Date.now();
  const body = {
    start: nowMs - lookbackMinutes * 60 * 1000,
    end: nowMs,
    requestType: "raw",
    compositeQuery: {
      queries: [
        {
          type: "builder_query",
          spec: {
            name: "A",
            signal: "traces",
            limit: 500,
            offset: 0,
          },
        },
      ],
    },
  };

  const response = await axios.post(
    `${SIGNOZ_API_URL}/api/v5/query_range`,
    body,
    { headers: hdrs() }
  );

  const list: any[] =
    response.data?.data?.data?.results?.[0]?.rows ||
    response.data?.data?.results?.[0]?.rows ||
    [];

  // Deduplicate conversation IDs
  const seen = new Set<string>();
  for (const span of list) {
    const convId = span?.data?.attributes?.["gen_ai.conversation.id"];
    if (convId) seen.add(convId);
  }

  return Array.from(seen);
}
