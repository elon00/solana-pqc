const safeText = (value) => typeof value === "string" ? value : "";

async function fetchJson(url, init, timeoutMs = 45000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = data?.error?.message || data?.message || response.statusText;
      throw new Error(`provider HTTP ${response.status}: ${detail}`);
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

export function providerStatus(env = process.env) {
  return {
    local: { configured: true, model: "local-safety-agent" },
    openai: {
      configured: Boolean(env.OPENAI_API_KEY && env.OPENAI_MODEL),
      model: env.OPENAI_MODEL || null
    },
    anthropic: {
      configured: Boolean(env.ANTHROPIC_API_KEY && env.ANTHROPIC_MODEL),
      model: env.ANTHROPIC_MODEL || null
    },
    gemini: {
      configured: Boolean(env.GEMINI_API_KEY && env.GEMINI_MODEL),
      model: env.GEMINI_MODEL || null
    }
  };
}

function chooseProvider(requested, env) {
  const status = providerStatus(env);
  if (requested && requested !== "auto") {
    if (!status[requested]) throw new Error("Unsupported model provider");
    if (!status[requested].configured) throw new Error(`${requested} provider is not configured`);
    return requested;
  }
  const priority = (env.MODEL_PROVIDER_PRIORITY || "openai,anthropic,gemini,local")
    .split(",").map((x) => x.trim()).filter(Boolean);
  return priority.find((name) => status[name]?.configured) || "local";
}

async function callOpenAI(message, system, env) {
  const base = (env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const data = await fetchJson(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: message }
      ]
    })
  });
  return safeText(data?.choices?.[0]?.message?.content);
}

async function callAnthropic(message, system, env) {
  const base = (env.ANTHROPIC_BASE_URL || "https://api.anthropic.com").replace(/\/$/, "");
  const data = await fetchJson(`${base}/v1/messages`, {
    method: "POST",
    headers: {
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": env.ANTHROPIC_VERSION || "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: env.ANTHROPIC_MODEL,
      max_tokens: Number(env.ANTHROPIC_MAX_TOKENS || 1200),
      system,
      messages: [{ role: "user", content: message }]
    })
  });
  return Array.isArray(data?.content)
    ? data.content.filter((x) => x?.type === "text").map((x) => safeText(x.text)).join("\n")
    : "";
}

async function callGemini(message, system, env) {
  const base = (env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta").replace(/\/$/, "");
  const model = encodeURIComponent(env.GEMINI_MODEL);
  const url = `${base}/models/${model}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;
  const data = await fetchJson(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: message }] }]
    })
  });
  return data?.candidates?.[0]?.content?.parts?.map((x) => safeText(x?.text)).join("\n") || "";
}

function localReply(message, context) {
  const chain = context?.chain?.ok
    ? `Solana Testnet RPC is reachable at slot ${context.chain.slot}.`
    : "Solana Testnet RPC is currently unavailable from the backend.";
  const wallet = context?.wallet
    ? ` Wallet ${context.wallet.address.slice(0, 6)}… has ${context.wallet.sol.toFixed(4)} Testnet SOL.`
    : "";
  return `SCSTOBCMinority AI local agent is active. ${chain}${wallet} External LLMs are optional server-side providers; configure one to enable generative multi-model responses. Request: ${String(message).slice(0, 600)}`;
}

export async function generateReply({ message, system, provider = "auto", context = {}, env = process.env }) {
  const selected = chooseProvider(provider, env);
  let reply;
  if (selected === "openai") reply = await callOpenAI(message, system, env);
  else if (selected === "anthropic") reply = await callAnthropic(message, system, env);
  else if (selected === "gemini") reply = await callGemini(message, system, env);
  else reply = localReply(message, context);
  if (!reply) throw new Error("Selected provider returned an empty response");
  return { provider: selected, reply };
}
