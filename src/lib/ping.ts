export type PingResult = {
  status: 'ok' | 'invalid' | 'network' | 'rate-limited';
  statusCode: number | null;
  message: string;
};

export type PingConfig = {
  url: string;
  method: 'GET' | 'POST';
  authHeader: string;
  authPrefix: string;
};

export const PROVIDER_PING_PRESETS: Record<string, PingConfig> = {
  openai: {
    url: 'https://api.openai.com/v1/models',
    method: 'GET',
    authHeader: 'Authorization',
    authPrefix: 'Bearer',
  },
  openrouter: {
    url: 'https://openrouter.ai/api/v1/auth/key',
    method: 'GET',
    authHeader: 'Authorization',
    authPrefix: 'Bearer',
  },
  anthropic: {
    url: 'https://api.anthropic.com/v1/models',
    method: 'GET',
    authHeader: 'x-api-key',
    authPrefix: '',
  },
  groq: {
    url: 'https://api.groq.com/openai/v1/models',
    method: 'GET',
    authHeader: 'Authorization',
    authPrefix: 'Bearer',
  },
  together: {
    url: 'https://api.together.xyz/v1/models',
    method: 'GET',
    authHeader: 'Authorization',
    authPrefix: 'Bearer',
  },
  mistral: {
    url: 'https://api.mistral.ai/v1/models',
    method: 'GET',
    authHeader: 'Authorization',
    authPrefix: 'Bearer',
  },
};

export function detectProviderPreset(providerName: string): PingConfig | null {
  const lower = providerName.toLowerCase();
  for (const [key, config] of Object.entries(PROVIDER_PING_PRESETS)) {
    if (lower.includes(key)) return config;
  }
  return null;
}

export async function pingApiKey(
  apiKey: string,
  config: PingConfig
): Promise<PingResult> {
  try {
    const headers: Record<string, string> = {};
    if (config.authPrefix) {
      headers[config.authHeader] = `${config.authPrefix} ${apiKey}`;
    } else {
      headers[config.authHeader] = apiKey;
    }

    if (config.url.includes('anthropic.com')) {
      headers['anthropic-version'] = '2023-06-01';
      headers['anthropic-dangerous-direct-browser-access'] = 'true';
    }

    const response = await fetch(config.url, {
      method: config.method,
      headers,
      signal: AbortSignal.timeout(10000),
    });

    if (response.status >= 200 && response.status < 300) {
      return { status: 'ok', statusCode: response.status, message: 'Active' };
    }
    if (response.status === 401 || response.status === 403) {
      return {
        status: 'invalid',
        statusCode: response.status,
        message: response.status === 401 ? 'Invalid key' : 'Forbidden / Revoked',
      };
    }
    if (response.status === 429) {
      return {
        status: 'rate-limited',
        statusCode: 429,
        message: 'Rate limited — try again later',
      };
    }
    return {
      status: 'network',
      statusCode: response.status,
      message: `HTTP ${response.status}`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('CORS')) {
      return {
        status: 'network',
        statusCode: null,
        message: 'Network/CORS blocked — endpoint may require server-side proxy',
      };
    }
    if (msg.includes('timeout') || msg.includes('Timeout') || msg.includes('Signal')) {
      return { status: 'network', statusCode: null, message: 'Request timed out' };
    }
    return { status: 'network', statusCode: null, message: msg };
  }
}
