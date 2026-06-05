# Connecting abbykamenetsky.com (Cloudflare → GitHub Pages)

The site is **fully portable**: every asset (textures, GLB models, HDRI, artwork, audio,
resume PDF) loads through `import.meta.env.BASE_URL`, and the deploy auto-switches the
base path based on whether `public/CNAME` exists.

- No `public/CNAME` → builds for the project URL
  `https://abigailkamenetsky.github.io/museum-portfolio/` (base `/museum-portfolio/`).
- `public/CNAME` present → builds for the custom domain root (base `/`).

A root-base build was verified: `index.html` references `/assets/...` and all models /
textures / artwork resolve. Nothing is lost in the move.

## Zero-downtime switch order (DO THIS, IN THIS ORDER)

### STEP 1 — Cloudflare DNS (you do this first; nothing in the repo changes yet)
In the Cloudflare dashboard for **abbykamenetsky.com** → DNS → Records, add:

| Type  | Name  | Target / Value                  | Proxy        |
|-------|-------|---------------------------------|--------------|
| CNAME | `@`   | `abigailkamenetsky.github.io`   | DNS only (grey) |
| CNAME | `www` | `abigailkamenetsky.github.io`   | DNS only (grey) |

(Cloudflare flattens the apex `@` CNAME automatically. If it refuses, use four A records
for `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.)

Set **SSL/TLS → Overview → Full**. Keep the records **DNS only (grey cloud)** for now —
the orange proxy before GitHub's cert is issued can stall the cert or cause redirect loops.

### STEP 2 — Flip the repo to the domain (Claude does this once Step 1 is in)
Add `public/CNAME` containing exactly:
```
abbykamenetsky.com
```
Commit + push. The next deploy builds at base `/` and tells GitHub Pages the custom domain.
(The `.github.io/museum-portfolio/` URL then 301-redirects to the domain — expected.)

### STEP 3 — GitHub Pages settings (you confirm)
Repo → Settings → Pages: "Custom domain" should show `abbykamenetsky.com`. Wait for the
**Let's Encrypt certificate** to finish issuing (shows in that panel), then tick
**Enforce HTTPS**.

### STEP 4 — (optional) Turn on Cloudflare's CDN
Once the GitHub cert is issued and HTTPS is enforced, you may switch the DNS records to the
**orange cloud (Proxied)** for Cloudflare caching. Set SSL/TLS to **Full (strict)**.

DNS + cert propagation can take minutes to a few hours.

## After the move — continuous updates still work the same
Nothing about the workflow changes. Every push to `main` runs the GitHub Actions deploy and
publishes to the same Pages site, now served at `abbykamenetsky.com`. Claude keeps editing,
building, and pushing in our chats exactly as before — the custom domain is just the address
the same deploy is served from.
