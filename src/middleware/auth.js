/**
 * Authentication middleware for admin endpoints
 * Validates Bearer token from Authorization header
 */
export function requireAuth(request, env) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return new Response('Unauthorized: Missing Authorization header', {
      status: 401,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  // Extract token from "Bearer <token>" format
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return new Response('Unauthorized: Invalid Authorization header format', {
      status: 401,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  const token = parts[1];

  // Compare with environment secret
  if (token !== env.AUTH_TOKEN) {
    // Provide helpful hint if token is close but not exact
    let hint = '';
    if (token.length !== env.AUTH_TOKEN.length) {
      hint = ` (Token length mismatch: received ${token.length} chars, expected ${env.AUTH_TOKEN.length})`;
    } else if (token.replace(/[=\s]/g, '') === env.AUTH_TOKEN.replace(/[=\s]/g, '')) {
      hint = ' (Hint: Check for trailing = signs or whitespace)';
    }

    return new Response(`Unauthorized: Invalid token${hint}`, {
      status: 401,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  // Authentication successful
  return null;
}
