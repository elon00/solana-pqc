const DEFAULT_FACILITATOR = "https://x402.org/facilitator";
const DEFAULT_PUBLIC_BASE = "https://scstobcminority-ai.netlify.app";
const DEFAULT_NETWORK = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1";
const DEFAULT_USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const DEFAULT_PAY_TO = "8qhW8ctXX77UNLTY9kx3XoAoH8kstQXPbCghUwqu34es";

export const X402_VERSION = 2;
export const X402_FACILITATOR_URL = (process.env.X402_FACILITATOR_URL || DEFAULT_FACILITATOR).replace(/\/$/, "");
export const X402_PUBLIC_BASE_URL = (process.env.X402_PUBLIC_BASE_URL || DEFAULT_PUBLIC_BASE).replace(/\/$/, "");
export const X402_NETWORK = process.env.X402_NETWORK || DEFAULT_NETWORK;
export const X402_ASSET = process.env.X402_ASSET || DEFAULT_USDC_MINT;
export const X402_PAY_TO = process.env.X402_RECIPIENT_WALLET || process.env.X402_PAY_TO || DEFAULT_PAY_TO;

const RESOURCES = {
  "pqc-keygen": {
    path: "/api/v1/x402/pqc-keygen",
    amount: "1000",
    description: "Generate a research PQC public-key bundle for an autonomous agent.",
    tags: ["pqc", "ml-kem", "ml-dsa", "solana", "ai-agent"],
    input: { type: "http", method: "POST" },
    inputSchema: {
      type: "object",
      properties: { label: { type: "string", description: "Optional caller label." } },
      additionalProperties: true
    },
    output: {
      type: "object",
      example: { success: true, protocol: "x402", service: "scstobcminority-ai" }
    }
  },
  "vault-lock": {
    path: "/api/v1/x402/vault-lock",
    amount: "2000",
    description: "Create a paid research vault commitment bound to the settled x402 receipt.",
    tags: ["custody", "vault", "solana", "pqc", "ai-agent"],
    input: { type: "http", method: "POST" },
    inputSchema: {
      type: "object",
      properties: {
        commitment: { type: "object", description: "Application-specific vault commitment payload." }
      },
      additionalProperties: true
    },
    output: {
      type: "object",
      example: { success: true, protocol: "x402", service: "scstobcminority-ai" }
    }
  }
};

let supportCache = { expiresAt: 0, value: null };

function b64json(value) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64");
}

export function decodePaymentHeader(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
  } catch {
    throw new Error("Invalid PAYMENT-SIGNATURE header");
  }
}

async function facilitatorSupport() {
  if (supportCache.value && supportCache.expiresAt > Date.now()) return supportCache.value;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`${X402_FACILITATOR_URL}/supported`, {
      headers: { accept: "application/json" },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`x402 facilitator /supported returned HTTP ${response.status}`);
    const data = await response.json();
    supportCache = { value: data, expiresAt: Date.now() + 60_000 };
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

function matchingKind(supported) {
  const kinds = Array.isArray(supported?.kinds) ? supported.kinds : [];
  return kinds.find((kind) =>
    Number(kind?.x402Version) === X402_VERSION &&
    kind?.scheme === "exact" &&
    kind?.network === X402_NETWORK
  ) || null;
}

export async function buildPaymentRequired(resourceKey) {
  const resource = RESOURCES[resourceKey];
  if (!resource) throw new Error("Unknown x402 resource");
  const supported = await facilitatorSupport();
  const kind = matchingKind(supported);
  if (!kind) {
    throw new Error(`Configured facilitator does not advertise x402 v2 exact support for ${X402_NETWORK}`);
  }
  const requirements = {
    scheme: "exact",
    network: X402_NETWORK,
    amount: resource.amount,
    asset: X402_ASSET,
    payTo: X402_PAY_TO,
    maxTimeoutSeconds: Number(process.env.X402_MAX_TIMEOUT_SECONDS || 60),
    extra: { ...(kind.extra || {}) }
  };
  const paymentRequired = {
    x402Version: X402_VERSION,
    error: "PAYMENT-SIGNATURE header is required",
    resource: {
      url: `${X402_PUBLIC_BASE_URL}${resource.path}`,
      description: resource.description,
      mimeType: "application/json",
      serviceName: "SCSTOBCMinority AI",
      tags: resource.tags
    },
    accepts: [requirements],
    extensions: {
      bazaar: {
        info: { input: resource.input, output: resource.output },
        schema: { input: resource.inputSchema }
      }
    }
  };
  return { paymentRequired, requirements, header: b64json(paymentRequired), resource };
}

export async function settlePayment(resourceKey, paymentSignatureHeader) {
  const paymentPayload = decodePaymentHeader(paymentSignatureHeader);
  const built = await buildPaymentRequired(resourceKey);
  if (!paymentPayload) return { paid: false, ...built };
  if (Number(paymentPayload?.x402Version) !== X402_VERSION) {
    return { paid: false, error: "Only x402 v2 payment payloads are accepted", ...built };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch(`${X402_FACILITATOR_URL}/settle`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        x402Version: X402_VERSION,
        paymentPayload,
        paymentRequirements: built.requirements
      }),
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.success) {
      return {
        paid: false,
        error: data?.errorReason || data?.error || `x402 settlement failed (HTTP ${response.status})`,
        settlement: data,
        ...built
      };
    }
    return {
      paid: true,
      settlement: data,
      paymentResponseHeader: b64json(data),
      extensionResponsesHeader: response.headers.get("extension-responses") || null,
      ...built
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function bazaarManifest() {
  const items = [];
  for (const key of Object.keys(RESOURCES)) {
    try {
      const { paymentRequired } = await buildPaymentRequired(key);
      items.push({
        resource: paymentRequired.resource.url,
        type: "http",
        x402Version: X402_VERSION,
        accepts: paymentRequired.accepts,
        extensions: paymentRequired.extensions
      });
    } catch (error) {
      items.push({
        resource: `${X402_PUBLIC_BASE_URL}${RESOURCES[key].path}`,
        type: "http",
        x402Version: X402_VERSION,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  return {
    x402Version: X402_VERSION,
    service: "SCSTOBCMinority AI",
    facilitator: X402_FACILITATOR_URL,
    catalogRegistration: "A Bazaar-capable facilitator indexes a resource after a conformant paid settlement echoes the bazaar extension.",
    items
  };
}
