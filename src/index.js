/**
 * Go Links Worker - Main entry point
 * A minimal personal URL shortener on Cloudflare Workers
 */

import { requireAuth } from './middleware/auth.js';
import { handleRedirect } from './handlers/redirect.js';
import { handleAdminUI } from './handlers/admin.js';
import {
  handleListLinks,
  handleGetLink,
  handleCreateLink,
  handleDeleteLink
} from './handlers/api.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS headers for API requests (optional - add if accessing from external tools)
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    // Handle OPTIONS for CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Route: Debug (temporary - check token)
    if (path === '/_debug') {
      return new Response(JSON.stringify({
        hasToken: !!env.AUTH_TOKEN,
        tokenLength: env.AUTH_TOKEN?.length || 0,
        tokenFirst10: env.AUTH_TOKEN?.substring(0, 10) || 'none'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Route: Admin UI
    if (path === '/_manage') {
      // No auth required to view the admin UI page itself
      // Auth is handled client-side via API calls
      return handleAdminUI();
    }

    // Route: List all links API
    if (path === '/_api/links' && method === 'GET') {
      const authError = requireAuth(request, env);
      if (authError) return authError;

      const response = await handleListLinks(env);
      // Add CORS headers
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    // Route: Create/Update link API
    if (path === '/_api/links' && method === 'POST') {
      const authError = requireAuth(request, env);
      if (authError) return authError;

      const response = await handleCreateLink(request, env);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    // Route: Get specific link API
    if (path.startsWith('/_api/links/') && method === 'GET') {
      const authError = requireAuth(request, env);
      if (authError) return authError;

      const shortcut = path.replace('/_api/links/', '');
      const response = await handleGetLink(env, shortcut);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    // Route: Delete link API
    if (path.startsWith('/_api/links/') && method === 'DELETE') {
      const authError = requireAuth(request, env);
      if (authError) return authError;

      const shortcut = path.replace('/_api/links/', '');
      const response = await handleDeleteLink(env, shortcut);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    // Route: Root path - show helpful message
    if (path === '/' || path === '') {
      return new Response(
        'Go Links Service\n\nUsage:\n- Visit /_manage to manage your links\n- Use /{shortcut} to redirect',
        {
          headers: { 'Content-Type': 'text/plain' }
        }
      );
    }

    // Route: Redirect (anything else that's not an API/admin path)
    if (!path.startsWith('/_')) {
      const shortcut = path.substring(1); // Remove leading '/'

      if (shortcut) {
        return await handleRedirect(request, env, shortcut);
      }
    }

    // 404 for unknown routes
    return new Response('Not found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};
