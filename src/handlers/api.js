/**
 * API handlers for link management
 */
import { isValidUrl, validateShortcut } from '../utils/validation.js';
import { getAnalytics } from '../utils/analytics.js';

/**
 * List all links - GET /_api/links
 */
export async function handleListLinks(env) {
  try {
    // List all keys in KV namespace
    const list = await env.LINKS_KV.list();

    // Fetch all link data
    const links = await Promise.all(
      list.keys.map(async (key) => {
        const data = await env.LINKS_KV.get(key.name);
        const link = JSON.parse(data);
        return {
          shortcut: key.name,
          ...link
        };
      })
    );

    return new Response(JSON.stringify({ links }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error listing links:', error);
    return new Response(JSON.stringify({ error: 'Failed to list links' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Get specific link - GET /_api/links/{shortcut}
 */
export async function handleGetLink(env, shortcut) {
  const normalizedShortcut = shortcut.toLowerCase();

  try {
    const data = await env.LINKS_KV.get(normalizedShortcut);

    if (!data) {
      return new Response(JSON.stringify({ error: 'Link not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const link = JSON.parse(data);

    // Get analytics for this link
    const analytics = await getAnalytics(env, normalizedShortcut);

    return new Response(JSON.stringify({
      shortcut: normalizedShortcut,
      ...link,
      analytics
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error getting link:', error);
    return new Response(JSON.stringify({ error: 'Failed to get link' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Create or update link - POST /_api/links
 */
export async function handleCreateLink(request, env) {
  try {
    // Parse request body
    const body = await request.json();
    const { shortcut, url, description } = body;

    // Validate shortcut
    const shortcutValidation = validateShortcut(shortcut);
    if (!shortcutValidation.valid) {
      return new Response(JSON.stringify({ error: shortcutValidation.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate URL
    if (!isValidUrl(url)) {
      return new Response(JSON.stringify({ error: 'Invalid URL format (must start with http:// or https://)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const normalizedShortcut = shortcut.toLowerCase();

    // Check if link already exists
    const existing = await env.LINKS_KV.get(normalizedShortcut);
    const isUpdate = !!existing;

    // Create link data
    const linkData = {
      url,
      description: description || '',
      createdAt: isUpdate ? JSON.parse(existing).createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store in KV
    await env.LINKS_KV.put(normalizedShortcut, JSON.stringify(linkData));

    return new Response(JSON.stringify({
      success: true,
      shortcut: normalizedShortcut,
      ...linkData,
      message: isUpdate ? 'Link updated' : 'Link created'
    }), {
      status: isUpdate ? 200 : 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating/updating link:', error);
    return new Response(JSON.stringify({ error: 'Failed to create/update link' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Delete link - DELETE /_api/links/{shortcut}
 */
export async function handleDeleteLink(env, shortcut) {
  const normalizedShortcut = shortcut.toLowerCase();

  try {
    // Check if link exists
    const existing = await env.LINKS_KV.get(normalizedShortcut);

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Link not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete from KV
    await env.LINKS_KV.delete(normalizedShortcut);

    return new Response(JSON.stringify({
      success: true,
      message: 'Link deleted',
      shortcut: normalizedShortcut
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting link:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete link' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
