// Native fetch keeps this scheduled script independent of an additional SDK.
// API contract: https://platform.claude.com/docs/en/api/messages/create
export const DEFAULT_SEO_MODEL = "claude-haiku-4-5-20251001";

export async function generateSeoDraft({
  apiKey,
  model = DEFAULT_SEO_MODEL,
  workspaceId = process.env.ANTHROPIC_WORKSPACE_ID,
  system,
  prompt,
  fetchImpl = globalThis.fetch,
}) {
  if (!apiKey?.trim()) throw new Error("ANTHROPIC_API_KEY is not configured.");
  let response;
  let data;
  try {
    response = await fetchImpl("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        ...(workspaceId ? { "anthropic-workspace-id": workspaceId } : {}),
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(120_000),
    });
    // Do not log provider response bodies: they may contain submitted data.
    if (!response.ok) {
      throw new Error("provider-status");
    }
    data = await response.json();
  } catch {
    const status = response && !response.ok ? ` (HTTP ${response.status})` : "";
    throw new Error(`Claude SEO request failed${status}; no article was published. Check credentials, billing, limits or service status.`);
  }
  if (!Array.isArray(data?.content) || !["end_turn", "max_tokens"].includes(data.stop_reason)) {
    throw new Error("Claude returned an unexpected response; no article was published.");
  }
  return {
    text: data.content
      .filter((block) => block.type === "text" && typeof block.text === "string")
      .map((block) => block.text)
      .join("\n")
      .trim(),
    truncated: data.stop_reason === "max_tokens",
    inputTokens: data.usage?.input_tokens ?? 0,
    outputTokens: data.usage?.output_tokens ?? 0,
  };
}

