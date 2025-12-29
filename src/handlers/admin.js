/**
 * Admin UI handler - serves the HTML admin interface
 */

// Inline HTML template (Wrangler doesn't support importing .html directly)
const adminHTML = `<!DOCTYPE html>
<html lang="en" data-theme="auto">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Go Links Admin</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css">
  <style>
    .link-actions button {
      margin: 0.25rem;
    }
    .auth-section {
      max-width: 400px;
      margin: 2rem auto;
    }
    .stats {
      color: var(--pico-muted-color);
      font-size: 0.875rem;
    }
    .hidden {
      display: none;
    }
    #errorMessage {
      color: var(--pico-del-color);
    }
    #successMessage {
      color: var(--pico-ins-color);
      font-weight: 500;
    }
  </style>
</head>
<body>
  <main class="container">
    <!-- Auth Section -->
    <div id="authSection" class="auth-section">
      <h1>Go Links Admin</h1>

      <div id="authErrorMessage"></div>

      <article>
        <header>Authentication Required</header>
        <form id="authForm">
          <input
            type="password"
            id="authToken"
            placeholder="Enter your auth token"
            required
            autocomplete="off"
          >
          <button type="submit">Login</button>
        </form>
        <p class="stats">Your token will be stored in session storage</p>
      </article>
    </div>

    <!-- Main Admin Interface -->
    <div id="adminSection" class="hidden">
      <h1>Go Links Admin</h1>

      <div id="errorMessage"></div>
      <div id="successMessage"></div>

      <!-- Create/Edit Form -->
      <article>
        <form id="linkForm">
          <input type="hidden" id="editingShortcut">
          <label>
            Shortcut
            <input
              type="text"
              id="shortcut"
              placeholder="gh"
              required
              pattern="[a-zA-Z0-9][a-zA-Z0-9_\\-]*[a-zA-Z0-9]|[a-zA-Z0-9]"
              title="Alphanumeric with hyphens/underscores (no leading/trailing hyphens)"
            >
            <small>The short path (e.g., "gh" for goto.rafe.eco/gh)</small>
          </label>

          <label>
            Destination URL
            <input
              type="url"
              id="url"
              placeholder="https://github.com/rafeco"
              required
            >
            <small>Full URL including http:// or https://</small>
          </label>

          <label>
            Description (optional)
            <input
              type="text"
              id="description"
              placeholder="Rafe's GitHub profile"
            >
          </label>

          <button type="submit" id="submitBtn">Create Link</button>
          <button type="button" id="cancelBtn" class="secondary hidden">Cancel</button>
        </form>
      </article>

      <!-- Links List -->
      <article>
        <header>
          <strong>Your Links</strong>
          <span class="stats" id="linkCount">0 links</span>
        </header>

        <input
          type="search"
          id="searchInput"
          placeholder="Search links..."
        >

        <figure>
          <table role="grid">
            <thead>
              <tr>
                <th>Shortcut</th>
                <th>Destination</th>
                <th>Description</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="linksTable">
              <tr>
                <td colspan="5" style="text-align: center;">
                  <em>Loading...</em>
                </td>
              </tr>
            </tbody>
          </table>
        </figure>
      </article>

      <!-- Logout -->
      <footer style="text-align: center; margin-top: 2rem;">
        <button id="logoutBtn" class="secondary outline">Log out</button>
      </footer>
    </div>
  </main>

  <script>
    // State
    let authToken = sessionStorage.getItem('authToken');
    let allLinks = [];
    const apiBase = '/_api';

    // DOM elements
    const authSection = document.getElementById('authSection');
    const adminSection = document.getElementById('adminSection');
    const authForm = document.getElementById('authForm');
    const linkForm = document.getElementById('linkForm');
    const linksTable = document.getElementById('linksTable');
    const searchInput = document.getElementById('searchInput');
    const logoutBtn = document.getElementById('logoutBtn');
    const authErrorMessage = document.getElementById('authErrorMessage');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');

    // Initialize
    if (authToken) {
      showAdmin();
      loadLinks();
      checkForShortcutParam();
    }

    // Check for shortcut query parameter (from 404 redirects)
    function checkForShortcutParam() {
      const params = new URLSearchParams(window.location.search);
      const shortcut = params.get('shortcut');
      if (shortcut) {
        // Pre-fill the form
        document.getElementById('shortcut').value = shortcut;
        document.getElementById('url').focus();

        // Show a helpful message
        errorMessage.textContent = \`Link "\${shortcut}" not found. Create it below:\`;
        errorMessage.style.color = 'var(--pico-color)'; // Normal text color, not red
        setTimeout(() => errorMessage.textContent = '', 15000);

        // Clear the query parameter from URL without reloading
        window.history.replaceState({}, '', '/_manage');
      }
    }

    // Auth form handler
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = document.getElementById('authToken').value;

      // Test token by trying to list links
      const response = await fetch(\`\${apiBase}/links\`, {
        headers: { 'Authorization': \`Bearer \${token}\` }
      });

      if (response.ok) {
        authToken = token;
        sessionStorage.setItem('authToken', token);
        authErrorMessage.textContent = '';
        showAdmin();
        loadLinks();
        checkForShortcutParam();
      } else {
        // Show the actual error message from the server
        const errorText = await response.text();
        authErrorMessage.textContent = errorText || 'Invalid authentication token';
        authErrorMessage.style.color = 'var(--pico-del-color)';
        setTimeout(() => authErrorMessage.textContent = '', 10000);
      }
    });

    // Logout handler
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('authToken');
      authToken = null;
      showAuth();
    });

    // Link form handler
    linkForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const editingShortcut = document.getElementById('editingShortcut').value;
      const shortcut = document.getElementById('shortcut').value;
      const url = document.getElementById('url').value;
      const description = document.getElementById('description').value;

      try {
        const response = await fetch(\`\${apiBase}/links\`, {
          method: 'POST',
          headers: {
            'Authorization': \`Bearer \${authToken}\`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ shortcut, url, description })
        });

        const data = await response.json();

        if (response.ok) {
          showSuccess(data.message || 'Link saved successfully');
          linkForm.reset();
          document.getElementById('editingShortcut').value = '';
          document.getElementById('submitBtn').textContent = 'Create Link';
          document.getElementById('cancelBtn').classList.add('hidden');
          document.getElementById('shortcut').disabled = false;

          // Optimistic update: add/update the link in the UI immediately
          const existingIndex = allLinks.findIndex(l => l.shortcut === data.shortcut);
          if (existingIndex >= 0) {
            // Update existing
            allLinks[existingIndex] = {
              shortcut: data.shortcut,
              url: data.url,
              description: data.description,
              createdAt: data.createdAt
            };
          } else {
            // Add new link at the beginning
            allLinks.unshift({
              shortcut: data.shortcut,
              url: data.url,
              description: data.description,
              createdAt: data.createdAt
            });
          }
          renderLinks(allLinks);
          document.getElementById('linkCount').textContent = \`\${allLinks.length} link\${allLinks.length !== 1 ? 's' : ''}\`;

          // Background refresh from KV after delay (eventual consistency)
          setTimeout(() => loadLinks(), 2000);
        } else {
          showError(data.error || 'Failed to save link');
        }
      } catch (error) {
        showError('Network error: ' + error.message);
      }
    });

    // Cancel edit button
    document.getElementById('cancelBtn').addEventListener('click', () => {
      linkForm.reset();
      document.getElementById('editingShortcut').value = '';
      document.getElementById('submitBtn').textContent = 'Create Link';
      document.getElementById('cancelBtn').classList.add('hidden');
      document.getElementById('shortcut').disabled = false;
    });

    // Search handler
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase();
      const filtered = allLinks.filter(link =>
        link.shortcut.toLowerCase().includes(query) ||
        link.url.toLowerCase().includes(query) ||
        (link.description || '').toLowerCase().includes(query)
      );
      renderLinks(filtered);
    });

    // Load links from API
    async function loadLinks() {
      try {
        const response = await fetch(\`\${apiBase}/links\`, {
          headers: { 'Authorization': \`Bearer \${authToken}\` }
        });

        if (!response.ok) {
          throw new Error('Failed to load links');
        }

        const data = await response.json();
        allLinks = data.links || [];
        renderLinks(allLinks);
        document.getElementById('linkCount').textContent = \`\${allLinks.length} link\${allLinks.length !== 1 ? 's' : ''}\`;
      } catch (error) {
        showError('Failed to load links: ' + error.message);
      }
    }

    // Render links table
    function renderLinks(links) {
      if (links.length === 0) {
        linksTable.innerHTML = \`
          <tr>
            <td colspan="5" style="text-align: center;">
              <em>No links found. Create your first one above!</em>
            </td>
          </tr>
        \`;
        return;
      }

      linksTable.innerHTML = links.map(link => \`
        <tr>
          <td><strong>\${escapeHtml(link.shortcut)}</strong></td>
          <td><a href="\${escapeHtml(link.url)}" target="_blank">\${truncate(escapeHtml(link.url), 50)}</a></td>
          <td>\${escapeHtml(link.description || '')}</td>
          <td class="stats">\${formatDate(link.createdAt)}</td>
          <td class="link-actions">
            <button class="secondary outline" onclick="editLink('\${escapeHtml(link.shortcut)}')">Edit</button>
            <button class="secondary outline" onclick="deleteLink('\${escapeHtml(link.shortcut)}')">Delete</button>
          </td>
        </tr>
      \`).join('');
    }

    // Edit link
    window.editLink = function(shortcut) {
      const link = allLinks.find(l => l.shortcut === shortcut);
      if (!link) return;

      document.getElementById('editingShortcut').value = shortcut;
      document.getElementById('shortcut').value = shortcut;
      document.getElementById('shortcut').disabled = true;
      document.getElementById('url').value = link.url;
      document.getElementById('description').value = link.description || '';
      document.getElementById('submitBtn').textContent = 'Update Link';
      document.getElementById('cancelBtn').classList.remove('hidden');

      // Scroll to form
      linkForm.scrollIntoView({ behavior: 'smooth' });
    };

    // Delete link
    window.deleteLink = async function(shortcut) {
      if (!confirm(\`Are you sure you want to delete "\${shortcut}"?\`)) {
        return;
      }

      try {
        const response = await fetch(\`\${apiBase}/links/\${shortcut}\`, {
          method: 'DELETE',
          headers: { 'Authorization': \`Bearer \${authToken}\` }
        });

        const data = await response.json();

        if (response.ok) {
          showSuccess('Link deleted successfully');
          loadLinks();
        } else {
          showError(data.error || 'Failed to delete link');
        }
      } catch (error) {
        showError('Network error: ' + error.message);
      }
    };

    // UI helpers
    function showAuth() {
      authSection.classList.remove('hidden');
      adminSection.classList.add('hidden');
    }

    function showAdmin() {
      authSection.classList.add('hidden');
      adminSection.classList.remove('hidden');
    }

    function showError(message) {
      errorMessage.textContent = message;
      successMessage.textContent = '';
      setTimeout(() => errorMessage.textContent = '', 5000);
    }

    function showSuccess(message) {
      successMessage.textContent = message;
      errorMessage.textContent = '';
      setTimeout(() => successMessage.textContent = '', 8000);
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    function truncate(str, maxLen) {
      return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
    }

    function formatDate(dateStr) {
      const date = new Date(dateStr);
      return date.toLocaleDateString();
    }
  </script>
</body>
</html>`;

export function handleAdminUI() {
  return new Response(adminHTML, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8'
    }
  });
}
