// Optional Sentry init; avoids importing if package not installed
export async function initSentry() {
  // No-op if Sentry not installed; to enable, install @sentry/nextjs and call this function.
  return;
}

