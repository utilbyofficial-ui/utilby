/**
 * Google AdSense configuration (server- and client-safe constants).
 *
 * Ads stay completely hidden until both values are set in Cloudflare Pages
 * (Settings → Environment variables) and the site is redeployed:
 *   NEXT_PUBLIC_ADSENSE_CLIENT = ca-pub-XXXXXXXXXXXXXXXX
 *   NEXT_PUBLIC_ADSENSE_SLOT   = 1234567890   (a display ad unit id)
 */
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";
export const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT ?? "";
export const ADS_ENABLED = /^ca-pub-\d+$/.test(ADSENSE_CLIENT) && /^\d+$/.test(ADSENSE_SLOT);
