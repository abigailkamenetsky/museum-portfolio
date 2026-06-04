# Connecting abigailkamenetsky.com (Cloudflare → GitHub Pages)

The deploy is **prepped**: the build base path auto-switches based on whether a
`public/CNAME` file exists.

- No `public/CNAME` → site builds for the project URL
  `https://abigailkamenetsky.github.io/museum-portfolio/` (base `/museum-portfolio/`).
- `public/CNAME` present → site builds for the custom domain root (base `/`).

## When you buy abigailkamenetsky.com on Cloudflare, do this:

### 1. Add the CNAME file (the only repo change)
Create `public/CNAME` containing exactly:
```
abigailkamenetsky.com
```
Commit + push. The next deploy will build with base `/` and tell GitHub Pages the
custom domain. (The `.github.io/museum-portfolio/` URL will then redirect to the
domain — expected.)

### 2. GitHub repo → Settings → Pages
Confirm "Custom domain" shows `abigailkamenetsky.com` (the CNAME file sets it).

### 3. Cloudflare DNS (apex domain)
Add a record for the root. Either:
- **CNAME (simplest, Cloudflare flattens apex):** `@` → `abigailkamenetsky.github.io`
- **or A/AAAA records to GitHub:**
  - A `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
  - AAAA `@` → `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`

Also add `www` → `abigailkamenetsky.github.io` (CNAME).

### 4. HTTPS
- Set Cloudflare **SSL/TLS mode = Full**.
- Set the GitHub-pointing DNS records to **"DNS only" (grey cloud)** until GitHub
  finishes issuing its Let's Encrypt certificate (Pages settings will show it). Turning
  on the orange-cloud proxy *before* the cert is issued can stall it.
- Once issued, tick **"Enforce HTTPS"** in GitHub Pages settings. You may then enable
  the Cloudflare proxy (orange cloud) if you want its CDN.

DNS + cert propagation can take minutes to a few hours.
