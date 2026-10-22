/**
 * Cloudflare Web Analytics configuration.
 *
 * Privacy-friendly, cookie-free web analytics powered by Cloudflare Insights.
 * To activate:
 * Set NEXT_PUBLIC_CF_ANALYTICS_TOKEN in Cloudflare Pages (Settings → Environment variables)
 * with your Cloudflare Web Analytics beacon token.
 */
export const CF_ANALYTICS_TOKEN = process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN ?? "";
export const CF_ANALYTICS_ENABLED = Boolean(CF_ANALYTICS_TOKEN.trim());
