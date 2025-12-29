# Go Links - Personal URL Shortener

A minimal personal URL shortener service deployed on Cloudflare Workers. Create memorable short links like `goto.example.com/abc` that redirect to frequently used URLs.

## Features

- ✨ **Clean URLs**: `goto.yourdomain.com/shortcut` format
- 🎨 **Modern Admin UI**: Built with Pico.css, auto dark/light mode
- 📊 **Usage Analytics**: Track redirect counts with Workers Analytics Engine
- 🔐 **Simple Auth**: Bearer token authentication for admin operations
- 💰 **Zero Cost**: Runs entirely on Cloudflare's free tier
- ⚡ **Fast**: Edge-optimized with Workers KV
- 🌍 **Global**: Replicated across Cloudflare's network

## Usage

### Admin UI

Visit `https://goto.yourdomain.com/_manage` to access the admin interface:

1. Enter your AUTH_TOKEN when prompted
2. Create, edit, and delete links
3. View usage statistics
4. Search through your links

### Using Your Links

Simply visit `https://goto.yourdomain.com/shortcut` and you'll be redirected to the target URL!

### Creating Links via API

You can also manage links programmatically:

```bash
# Create a link
curl -X POST https://goto.yourdomain.com/_api/links \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shortcut": "gh",
    "url": "https://github.com/rafeco",
    "description": "Rafe'\''s GitHub profile"
  }'

# List all links
curl https://goto.yourdomain.com/_api/links \
  -H "Authorization: Bearer YOUR_TOKEN"

# Delete a link
curl -X DELETE https://goto.yourdomain.com/_api/links/gh \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Access locally at http://localhost:8787
```

Make sure `.dev.vars` contains your `AUTH_TOKEN` for local testing.

## Deployment

The project uses GitHub Actions for automated deployments. Simply push to main:

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

The workflow will automatically run linting and deploy to Cloudflare Workers. Monitor progress in the "Actions" tab on GitHub.

### Manual Deployment

You can also deploy manually when needed:

```bash
npm run deploy
# or
wrangler deploy
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/{shortcut}` | No | Redirect to target URL |
| GET | `/_manage` | Yes | Admin UI |
| GET | `/_api/links` | Yes | List all links |
| GET | `/_api/links/{shortcut}` | Yes | Get specific link details |
| POST | `/_api/links` | Yes | Create/update link |
| DELETE | `/_api/links/{shortcut}` | Yes | Delete link |

## Shortcut Rules

Valid shortcuts:
- Alphanumeric characters (a-z, A-Z, 0-9)
- Hyphens and underscores allowed in the middle
- 1-100 characters long
- Case-insensitive (automatically normalized to lowercase)

Reserved shortcuts (cannot be used):
- `_manage`
- `_api`
- Anything starting with underscore

## Project Structure

```
cf-goto/
├── wrangler.toml              # Worker configuration
├── package.json               # Dependencies and scripts
├── .eslintrc.json            # Linting configuration
├── .github/workflows/         # CI/CD automation
├── .gitignore                # Ignore secrets and build artifacts
├── .dev.vars                 # Local development secrets
├── README.md                 # This file
└── src/
    ├── index.js              # Main worker entry point
    ├── handlers/
    │   ├── redirect.js       # Redirect handler
    │   ├── api.js            # API endpoint handlers
    │   └── admin.js          # Admin UI handler
    ├── middleware/
    │   └── auth.js           # Authentication middleware
    └── utils/
        ├── validation.js     # URL and shortcut validation
        └── analytics.js      # Analytics Engine helpers
```

## Security

- Admin endpoints require Bearer token authentication
- Token is stored as a Worker secret (never in code)
- HTTPS enforced by Cloudflare
- CORS headers included for API access
- Input validation for URLs and shortcuts
- XSS protection through HTML escaping

## Troubleshooting

### "Unauthorized" when accessing /_manage

- Make sure you've set the AUTH_TOKEN secret: `wrangler secret put AUTH_TOKEN`
- Check that you're entering the correct token in the admin UI
- Token is stored in localStorage - try clearing browser data if having issues

### KV errors during development

- Ensure you've created both production and preview KV namespaces
- Check that namespace IDs in `wrangler.toml` match your created namespaces
- Run `wrangler kv namespace list` to see your namespaces

### Worker not updating after deploy

- Hard refresh your browser (Cmd+Shift+R or Ctrl+Shift+F5)
- Check `wrangler tail` for live logs
- Verify deployment with `wrangler deployments list`

## Analytics

The service tracks redirect events using Cloudflare's Analytics Engine:
- Shortcut used
- Referrer
- User agent
- Country (from Cloudflare's edge data)
- Timestamp

Analytics querying via GraphQL/SQL API is not yet implemented but the data is being collected. To query your analytics, you can use Cloudflare's Analytics Engine SQL API.

## Cost Analysis

Expected cost: **$0/month** on free tier

**Free tier limits:**
- Workers: 100,000 requests/day
- KV reads: 100,000/day
- KV writes: 1,000/day
- Analytics Engine: Unlimited (currently free)

With typical personal use (100 redirects/day, 5 updates/day), you'll use less than 1% of the free tier.

---

## Initial Setup

This section covers one-time setup for new installations.

### Prerequisites

1. A Cloudflare account
2. A domain managed by Cloudflare (or add one)
3. Node.js and npm installed
4. Wrangler CLI installed:
   ```bash
   npm install -g wrangler
   ```

### 1. Login to Cloudflare

```bash
wrangler login
```

### 2. Create KV Namespaces

```bash
# Production namespace
wrangler kv namespace create LINKS_KV

# Preview namespace (for local development)
wrangler kv namespace create LINKS_KV --preview
```

This will output namespace IDs. Copy them to `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "LINKS_KV"
id = "your_production_namespace_id_here"
preview_id = "your_preview_namespace_id_here"
```

### 3. Set Up Authentication Token

Generate a secure random token:

```bash
# Generate a token
openssl rand -base64 32
```

Set it as a secret:

```bash
# For production
wrangler secret put AUTH_TOKEN
# Paste the generated token when prompted

# For local development, add to .dev.vars file:
echo "AUTH_TOKEN=your-generated-token-here" > .dev.vars
```

**Save this token securely** - you'll need it to access the admin UI!

### 4. Initial Deploy

```bash
npm install
wrangler deploy
```

The Worker will be deployed to `goto-links.your-account.workers.dev`.

### 5. Configure Custom Domain

1. Go to the Cloudflare dashboard
2. Navigate to: **Workers & Pages** → **goto-links** → **Settings** → **Triggers**
3. Click **Add Custom Domain**
4. Enter your desired subdomain (e.g., `goto.yourdomain.com`)
5. Click **Add Custom Domain**

Cloudflare will automatically configure DNS. Your service will be live at your custom domain in a few minutes!

### 6. Set Up CI/CD (GitHub Actions)

The project includes a GitHub Actions workflow that automatically deploys to Cloudflare Workers when you push to the main branch.

#### Get your Cloudflare Account ID

Find it in your Cloudflare dashboard URL: `https://dash.cloudflare.com/<your-account-id>`

Or run:
```bash
wrangler whoami
```

#### Create a Cloudflare API Token

Go to: https://dash.cloudflare.com/profile/api-tokens

- Click "Create Token"
- Use the "Edit Cloudflare Workers" template
- Under "Account Resources", select your account
- Under "Zone Resources", select "All zones" or specific zones
- Click "Continue to summary" and "Create Token"
- **Copy the token** - you won't see it again!

#### Add Secrets to GitHub

Go to your GitHub repo: **Settings** → **Secrets and variables** → **Actions**

Click "New repository secret" and add:

- Name: `CLOUDFLARE_API_TOKEN`
  - Value: (paste the API token from above)

- Name: `CLOUDFLARE_ACCOUNT_ID`
  - Value: (paste your account ID from above)

#### Test the Workflow

```bash
git add .
git commit -m "Initial commit with CI/CD"
git push origin main
```

The workflow will automatically run linting and deploy to Cloudflare Workers. You can monitor progress in the "Actions" tab on GitHub.

---

## License

MIT License - feel free to use and modify for your own purposes!

## Credits

Built with:
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Workers KV](https://developers.cloudflare.com/kv/)
- [Analytics Engine](https://developers.cloudflare.com/analytics/analytics-engine/)
- [Pico.css](https://picocss.com/) for the admin UI
