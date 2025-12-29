/**
 * Redirect handler - handles GET /{shortcut}
 */
import { trackRedirect } from '../utils/analytics.js';

export async function handleRedirect(request, env, shortcut) {
  // Normalize shortcut to lowercase
  const normalizedShortcut = shortcut.toLowerCase();

  // Fetch link data from KV
  const linkData = await env.LINKS_KV.get(normalizedShortcut);

  if (!linkData) {
    // Redirect to admin page with shortcut pre-filled
    const url = new URL(request.url);
    url.pathname = '/_manage';
    url.searchParams.set('shortcut', normalizedShortcut);
    return Response.redirect(url.toString(), 302);
  }

  // Parse the JSON data
  let link;
  try {
    link = JSON.parse(linkData);
  } catch (error) {
    console.error('Error parsing link data:', error);
    return new Response('Invalid link data', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  // Track the redirect in Analytics Engine
  trackRedirect(env, normalizedShortcut, request);

  // Redirect to target URL (302 temporary redirect)
  return Response.redirect(link.url, 302);
}
