/**
 * AI providers a student can connect with their OWN API key (Settings -> AI mentor).
 * Shared by the browser (form) and the server (routes). The server maps a provider id to its
 * base URL from THIS allowlist and never accepts a URL from the client, so a user-supplied
 * key cannot be used to make the server call an arbitrary or internal address (SSRF).
 */
export type ProviderId = "nvidia" | "cline";

export interface ProviderPreset {
  id: ProviderId;
  label: string;
  baseUrl: string;
  defaultModel: string;
  /** whether the default model accepts images */
  defaultVision: boolean;
  keyPrefixHint: string;
  getKeyUrl: string;
}

export const PROVIDERS: Record<ProviderId, ProviderPreset> = {
  nvidia: {
    id: "nvidia",
    label: "NVIDIA NIM",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    defaultModel: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
    defaultVision: true,
    keyPrefixHint: "nvapi-…",
    getKeyUrl: "https://build.nvidia.com",
  },
  cline: {
    id: "cline",
    label: "Cline API",
    baseUrl: "https://api.cline.bot/api/v1",
    defaultModel: "anthropic/claude-sonnet-4-6",
    defaultVision: true,
    keyPrefixHint: "Create one at app.cline.bot → Settings → API Keys",
    getKeyUrl: "https://app.cline.bot",
  },
};

export const PROVIDER_IDS = Object.keys(PROVIDERS) as [ProviderId, ...ProviderId[]];

/** What the student saves in Settings. Stored only in this browser. */
export interface AiSettings {
  provider: ProviderId;
  apiKey: string;
  model: string;
  vision: boolean;
}

export function defaultSettings(provider: ProviderId = "nvidia"): AiSettings {
  const p = PROVIDERS[provider];
  return { provider, apiKey: "", model: p.defaultModel, vision: p.defaultVision };
}

export const MODEL_PATTERN = /^[A-Za-z0-9._:/-]{1,120}$/;
