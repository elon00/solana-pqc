const DEFAULT_FACILITATOR = "https://x402.org/facilitator";
const DEFAULT_PUBLIC_BASE = "https://scstobcminority-ai.netlify.app";
const DEFAULT_NETWORK = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1";
const DEFAULT_USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const DEFAULT_PAY_TO = "BPshPrMazV7qunhcq18AvCHjSceHbKytiRDNrtCv68g3";

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
    inputExample: { label: "agent-demo" },
    inputSchema: {
      type: "object",
      properties: { label: { type: "string", description: "Optional caller label." } },
      additionalProperties: true
    },
    outputExample: { success: true, protocol: "x402", service: "scstobcminority-ai" },
    outputSchema: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        protocol: { type: "string" },
        service: { type: "string" }
      },
      required: ["success", "protocol", "service"]
    }
  },
  "vault-lock": {
    path: "/api/v1/x402/vault-lock",
    amount: "2000",
    description: "Create a paid research vault commitment bound to the settled x402 receipt.",
    tags: ["custody", "vault", "solana", "pqc", "ai-agent"],
    inputExample: { commitment: { id: "example" } },
    inputSchema: {
      type: "object",
      properties: {
        commitment: { type: "object", description: "Application-specific vault commitment payload." }
      },
      additionalProperties: true
    },
    outputExample: { success: true, protocol: "x402", service: "scstobcminority-ai" },
    outputSchema: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        protocol: { type: "string" },
        service: { type: "string" }
      },
      required: ["success", "protocol", "service"]
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
  const facilitatorSigner =
    kind?.extra?.feePayer ||
    supported?.signers?.[X402_NETWORK]?.[0] ||
    supported?.signers?.["solana:*"]?.[0] ||
    null;
  if (!facilitatorSigner) {
    throw new Error("Configured facilitator did not advertise an SVM fee payer");
  }
  const requirements = {
    scheme: "exact",
    network: X402_NETWORK,
    amount: resource.amount,
    asset: X402_ASSET,
    payTo: X402_PAY_TO,
    maxTimeoutSeconds: Number(process.env.X402_MAX_TIMEOUT_SECONDS || 60),
    extra: { ...(kind.extra || {}), feePayer: facilitatorSigner, paymentFlow: "upfront" }
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
        info: {
          input: {
            type: "http",
            method: "POST",
            bodyType: "json",
            body: resource.inputExample
          },
          output: {
            type: "json",
            example: resource.outputExample,
            schema: resource.outputSchema
          }
        },
        schema: {
          type: "object",
          properties: {
            input: {
              type: "object",
              properties: {
                type: { const: "http" },
                method: { const: "POST" },
                bodyType: { const: "json" },
                body: resource.inputSchema
              },
              required: ["type", "method", "bodyType"]
            },
            output: {
              type: "object",
              properties: {
                type: { const: "json" },
                example: {},
                schema: { type: "object" }
              },
              required: ["type"]
            }
          },
          required: ["input", "output"]
        }
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
  if (paymentPayload?.resource?.url !== built.paymentRequired.resource.url) {
    return { paid: false, error: "x402 payment payload resource does not match this protected endpoint", ...built };
  }
  if (!paymentPayload?.extensions?.bazaar) {
    return { paid: false, error: "x402 payment payload must echo the Bazaar extension advertised by the server", ...built };
  }
  const accepted = paymentPayload?.accepted || {};
  for (const field of ["scheme", "network", "amount", "asset", "payTo"]) {
    if (String(accepted[field] ?? "") !== String(built.requirements[field] ?? "")) {
      return { paid: false, error: `x402 accepted.${field} does not match the advertised payment requirement`, ...built };
    }
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
    ready: items.some((item) => Array.isArray(item.accepts) && item.accepts.length > 0),
    catalogRegistration: "A Bazaar-capable facilitator indexes a resource after a conformant paid settlement echoes the bazaar extension.",
    items
  };
}
