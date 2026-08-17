function safeString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function resolveCloudflareAccessServiceAuth(env = process.env) {
  const clientId = safeString(env.CLOUDFLARE_ACCESS_CLIENT_ID);
  const clientSecret = safeString(env.CLOUDFLARE_ACCESS_CLIENT_SECRET);

  if (Boolean(clientId) !== Boolean(clientSecret)) {
    throw new Error(
      'Cloudflare Access service auth is incomplete: CLOUDFLARE_ACCESS_CLIENT_ID and CLOUDFLARE_ACCESS_CLIENT_SECRET must be configured together.',
    );
  }

  if (!clientId) {
    return { configured: false, headers: {} };
  }

  return {
    configured: true,
    headers: {
      'CF-Access-Client-Id': clientId,
      'CF-Access-Client-Secret': clientSecret,
    },
  };
}
