# Security Hardening for Next.js Applications

## Purpose and Scope

This document codifies security hardening practices for Next.js applications deployed via Docker and Docker Swarm orchestrators (Dokploy, CapRover, Portainer, or plain Compose). It is designed to be copied into any Next.js repository and referenced by LLM coding assistants during security reviews, Dockerfile changes, dependency updates, and deployment configuration.

The controls here are based on lessons learned from two production cryptominer incidents:

- **Incident 1**: suspected supply chain attack (malicious npm postinstall) in a Next.js frontend
- **Incident 2**: unauthenticated RCE via CVE-2025-55182 (React Flight protocol, "React2Shell") in a Next.js backend that was pinned one patch version below the fix

The common pattern in both: attacker got code execution inside the Next.js process, dropped a miner binary into `/tmp` via a base64 payload, connected to a mining pool, and exfiltrated every environment variable in the process.

## Threat Model

Assume any of the following can happen:

- A critical vulnerability is published in Next.js, React, or a transitive dependency
- A dependency is compromised via supply chain attack (typosquat, maintainer takeover, malicious postinstall)
- Application code accidentally introduces a sink that passes user input to a shell, exec, eval, deserializer, or SSRF target
- An attacker with RCE inside the container tries to connect to a mining pool, exfiltrate secrets, pivot to other services, or establish persistence

Effective hardening is **layered**. Assume any single layer can fail and design so the next layer still contains damage.

---

## Layered Defenses

### Layer 1: Keep Dependencies Patched (non-negotiable)

**Pinning alone is not enough.** A pinned version freezes you at a point in time; if a CVE is published for that exact version, you are vulnerable until you explicitly bump. Pinning must be combined with active auditing.

#### Requirements

- Pin exact versions for all production dependencies (`"next": "16.2.3"` not `"^16.2.3"`)
- Run `npm audit --production --audit-level=high` in CI and fail the build on findings
- Review `npm audit` output before every deploy, even if CI passed
- Subscribe to GitHub security advisories for `vercel/next.js`, `facebook/react`, and any framework dependency used by the app
- Use Dependabot or Renovate to generate PRs for patch-level security updates
- When a critical CVE is published for a dependency in use, patch within 24 hours

#### Current recommended Next.js version

**As of April 19, 2026, the latest stable Next.js release is `16.2.3`.** This version includes all security patches listed below. New projects and production deployments should target `16.2.3` or later unless a specific dependency constraint forces staying on an earlier minor line.

If you cannot upgrade to 16.x, the minimum-safe patched version per minor line is:

- `14.x` line: `14.2.35` or later (DoS and RSC fixes)
- `15.0.x`: `15.0.5` or later
- `15.1.x`: `15.1.9` or later
- `15.2.x`: `15.2.6` or later
- `15.3.x`: `15.3.6` or later
- `15.4.x`: `15.4.8` or later
- `15.5.x`: `15.5.13` or later
- `16.0.x`: `16.0.7` or later
- `16.1.x`: `16.1.7` or later
- `16.2.x`: `16.2.3` or later

**LLM reviewers**: the list above is a floor that was correct as of April 2026. Always cross-check the `next` version in the repo against the current advisories at https://github.com/vercel/next.js/security/advisories and the release notes at https://github.com/vercel/next.js/releases before declaring a version "safe". New CVEs are disclosed regularly.

#### Known critical Next.js CVEs to check against

If the `next` version in `package.json` is below the fixed version for any of these, the app is unpatched against that CVE:

- **CVE-2025-29927** (middleware authorization bypass, high severity), fixed in 14.2.25, 15.2.3. Allows auth middleware to be bypassed via a crafted `x-middleware-subrequest` header
- **CVE-2025-55182 / CVE-2025-66478** (React Flight protocol RCE, "React2Shell", CVSS 10.0 critical), fixed in 15.0.5, 15.1.9, 15.2.6, 15.3.6, 15.4.8, 15.5.7, 16.0.7. Unauthenticated RCE in App Router apps using React 19.0.0, 19.1.0, 19.1.1, or 19.2.0
- **CVE-2025-55183** (RSC source code exposure, medium severity), disclosed Dec 11, 2025, affects 13.x through 16.x App Router
- **CVE-2025-55184** (RSC denial of service, high severity), disclosed Dec 11, 2025, affects 13.x through 16.x App Router
- **CVE-2026-23864** (App Router Server Function DoS via deserialization, CVSS 7.5 high), disclosed Jan 26, 2026, fixed in 14.2.35 and later line patches. Crafted HTTP requests to Server Function endpoints cause memory exhaustion
- **CVE-2026-23869** (RSC follow-up vulnerability), fixed in 16.2.3 and equivalent line patches. See https://vercel.com/changelog/summary-of-cve-2026-23869
- **CVE-2026-27979** (maxPostponedStateSize enforcement), fixed in current line patches
- **CVE-2026-27980** (image optimization disk cache unbounded growth, CVSS 7.5 high), fixed in 16.1.7 and line patches. Repeated requests to `/_next/image` with varying query parameters fill disk until the server crashes
- **CVE-2026-29057** (HTTP request smuggling in rewrites, CVSS 6.5 medium), fixed in 15.5.13, 16.1.7 and later. Affects apps with Next.js `rewrites` pointing to external backends when the proxy and backend disagree on chunked request boundaries

#### Audit commands

```bash
# Check current Next.js version
grep '"next"' package.json

# Full production audit
npm audit --production --audit-level=high

# See vulnerabilities with fix paths in JSON
npm audit --production --json | jq '.vulnerabilities'

# Apply safe fixes
npm audit fix

# Apply breaking fixes (review changelogs first)
npm audit fix --force
```

---

### Layer 2: Application-Level Hardening

#### 2a. Never pass user input to shell-executing functions

The classic Node.js RCE sink looks like:

```typescript
// UNSAFE: user input flows into a shell command
exec(`convert ${userFilename} out.png`)
```

Safer patterns:

- Never use `child_process.exec` or `execSync` with user-controlled strings
- Use `execFile` with an args array, which skips shell interpretation entirely:
  ```typescript
  execFile('convert', [userFilename, 'out.png'])
  ```
- If shelling out is truly required, whitelist-validate inputs against a strict regex and use a shell-escape library

During code review, grep for these sinks:

```bash
grep -rnE '\b(exec|execSync|spawn|spawnSync)\s*\(' src/
grep -rnE '\beval\s*\(' src/
grep -rnE 'new\s+Function\s*\(' src/
grep -rnE 'require\(["'\'']vm["'\'']\)|from ["'\'']vm["'\'']' src/
```

#### 2b. Strip dangerous headers via middleware or proxy

Next.js 16 renamed `middleware.ts` to `proxy.ts`. The pattern below applies the same hardening, the file and export name differ by version.

**For Next.js 16.x**, create `proxy.ts` at the repo root:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default function proxy(request: NextRequest) {
  // Defense in depth against CVE-2025-29927 middleware bypass
  const cleanHeaders = new Headers(request.headers)
  cleanHeaders.delete('x-middleware-subrequest')

  const response = NextResponse.next({
    request: { headers: cleanHeaders },
  })

  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )

  return response
}

export const config = {
  matcher: '/:path*',
}
```

**For Next.js 15.x (still supported)**, create `middleware.ts` at the repo root with the same body but using `export function middleware(...)` instead of `export default function proxy(...)`. The Next.js 16 upgrade guide has a codemod that handles this rename automatically.

#### 2c. Disable server fingerprinting and set headers in `next.config.ts`

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  poweredByHeader: false, // Remove X-Powered-By: Next.js
  output: 'standalone',   // Enables the minimal runtime image below

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Add Content-Security-Policy once content sources are mapped.
          // Start in report-only mode before enforcing.
        ],
      },
    ]
  },
}

export default nextConfig
```

---

### Layer 3: Container Hardening

The goal: if the app is compromised at the framework or code level, make it hard for the attacker to write executables, escalate privileges, or persist.

#### 3a. Hardened Dockerfile

```dockerfile
# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# --ignore-scripts blocks malicious postinstall in transitive deps (supply chain defense)
RUN npm ci --ignore-scripts --omit=dev

FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user with a known UID for audit visibility
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Standalone output: smaller attack surface, no dev dependencies in runtime
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Make /app read-only. Attackers fall back to /tmp, which is restricted at runtime.
RUN chmod -R a-w /app

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
```

Key properties:

- `--ignore-scripts` blocks supply chain postinstall attacks at build time
- Multi-stage build keeps final image small and free of build tools
- Non-root user (`nextjs`, UID 1001) with a predictable UID for log auditing
- `chmod -R a-w /app` makes app code immutable at runtime
- `output: 'standalone'` in `next.config.ts` produces a minimal runtime image

#### 3b. Runtime restrictions

Apply these in `docker-compose.yml`, Swarm service definition, or the equivalent orchestrator config:

```yaml
services:
  app:
    image: my-next-app:latest
    read_only: true
    tmpfs:
      # Size-limited noexec tmpfs prevents dropping and running a miner binary
      - /tmp:rw,noexec,nosuid,size=64m
      - /app/.next/cache:rw,noexec,nosuid,size=256m
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add: []  # add back only what the app actually needs (usually nothing)
    user: "1001:1001"
    # Do not expose management or admin surfaces publicly
```

Rationale:

- **`read_only: true`** plus tmpfs with **`noexec`** means the attacker cannot execute anything they write. The `noexec` flag on `/tmp` is the single control that would have stopped the miner from running in the referenced incidents
- **`size=64m`** cap on `/tmp` means even without `noexec`, the attacker cannot drop a typical 3 MB miner binary
- **`no-new-privileges`** blocks setuid escalation paths
- **`cap_drop: ALL`** removes Linux capabilities an HTTP app almost certainly does not need

#### 3c. Never expose management dashboards publicly

- Platform dashboards (Dokploy, CapRover, Portainer, Traefik dashboard) must be behind a VPN, never reachable from the public internet
- Public Let's Encrypt certificates appear in Certificate Transparency logs and are actively scraped by attackers looking for management surfaces
- Use WireGuard, Tailscale, or Cloudflare Tunnel with Access for any admin UI

---

### Layer 4: Network Egress Controls (highest-value defense)

**This is the single highest-value control.** Even if an attacker achieves RCE, a miner is useless if it cannot reach a mining pool, and exfiltration is blocked if outbound connections are allowlisted.

#### 4a. Docker and UFW interaction

Docker manipulates iptables directly and bypasses UFW by default. This is a critical gotcha, and was the root cause of an earlier incident on the same host. Two options:

**Option A (recommended)**: disable Docker's iptables management and use UFW for everything.

```json
// /etc/docker/daemon.json
{
  "iptables": false
}
```

Then set `DEFAULT_FORWARD_POLICY="ACCEPT"` in `/etc/default/ufw` to preserve container internet access.

**Option B**: keep Docker's iptables management and insert rules into the `DOCKER-USER` chain for egress control. More flexible but more complex.

#### 4b. Egress allowlist per service

Ideal state: each container can only reach the specific external hosts it needs. For a typical Next.js app that might be:

- Database provider (Supabase, Postgres hostname, RDS endpoint)
- Payment provider (Stripe API)
- OAuth providers (Google, GitHub)
- Specific API integrations (Shopify, Etsy, Shippo)

Everything else is blocked.

Implementation approaches, from most to least integrated:

- **Docker overlay network policies** (Swarm, Cilium) for declarative per-service allowlists
- **Egress proxy** (Squid, Envoy, tinyproxy) that containers talk to, proxy enforces allowlist
- **Per-host iptables** on the `DOCKER-USER` chain with explicit ACCEPT rules for allowed IPs and a REJECT default

Emergency-mode block (when an incident is in progress):

```bash
# Block known bad IPs immediately
sudo ufw route deny to <BAD_IP_1>
sudo ufw route deny to <BAD_IP_2>

# Drop existing connections so the block takes effect now
sudo apt install -y conntrack
sudo conntrack -D -d <BAD_IP_1>
sudo conntrack -D -d <BAD_IP_2>
```

#### 4c. Common miner pool ports to alarm on

If full egress allowlisting is not yet implemented, at minimum alert on outbound traffic to these ports from any app container:

- `3333`, `4444`, `5555`, `7777`, `8888`, `9999` (common Stratum)
- `14444`, `14433`, `33333`, `45700` (common Monero pool variants)

Any outbound connection from an application container to these ports is almost always a miner.

---

### Layer 5: Secrets Handling

Hard lesson from Incident 2: once the attacker had RCE, a single `cat /proc/self/environ` leaked every credential the app had, including the Supabase service role key, Shopify admin token, database password, and JWT signing secret.

#### Principles

- Assume any environment variable in the container is readable by any process running in that container
- Scope every credential to the least privilege it needs
- For Supabase specifically: avoid using the service role key in runtime containers at all, rely on row-level security and user-scoped keys wherever possible
- For Shopify, Stripe, OAuth: use narrowly-scoped tokens, never full admin
- Rotate credentials on a schedule (at least quarterly) and immediately on any suspected compromise
- Ensure `.env.local` and equivalent files are in `.gitignore`
- Never log credentials (audit `console.log`, error handlers, and Sentry/Datadog/LogRocket breadcrumbs)

#### Post-incident credential rotation order

If an incident is suspected, rotate all of the following, in this priority order:

1. Database passwords (highest value, broadest access)
2. Third-party API admin tokens (Supabase service role, Stripe secret, Shopify admin, etc)
3. OAuth client secrets (Google, GitHub, etc)
4. JWT signing keys (`NEXTAUTH_SECRET`, `JWT_SECRET`)
5. Admin passwords (`ADMIN_PASSWORD` and similar)
6. SSH deploy keys
7. Service-to-service shared secrets

---

### Layer 6: Detection and Response

#### Monitoring

- Log all reverse proxy requests (Traefik, nginx, Caddy) with timestamps, source IPs, paths, methods, status codes, and body sizes. Retain 30+ days, shipped to host disk or external log storage so logs survive container restarts
- Monitor container CPU. A mining container pins at 90%+ continuously, very different from normal traffic-driven patterns
- Alert on outbound connections to IPs or ports outside the allowlist
- Alert on any process inside a container whose exe path is in `/tmp`, `/dev/shm`, or `/var/tmp`, or that shows `(deleted)`

#### Quick triage commands

If you suspect a container is compromised:

```bash
# Is there a process running from /tmp or with a deleted exe?
sudo ls -la /proc/*/exe 2>/dev/null | grep -E '/tmp/|/dev/shm/|\(deleted\)'

# Which container is the PID in?
sudo cat /proc/<PID>/cgroup

# What is it talking to? (process is in container netns, so use nsenter)
sudo nsenter -t <PID> -n ss -tnpe

# Dump the binary from memory before the container dies
sudo mkdir -p /root/forensics-$(date +%F)
sudo cp /proc/<PID>/exe /root/forensics-$(date +%F)/suspicious.bin
sudo sha256sum /root/forensics-*/suspicious.bin

# Check the process environ for what credentials were exposed
sudo cat /proc/<PID>/environ | tr '\0' '\n'

# Get the parent process chain (often reveals the entry vector)
ps -ef --forest | grep -B5 <PID>
```

**Do not kill the process immediately.** Collect forensics first: binary from memory, network connections via `nsenter`, parent process tree, container logs around the suspected entry time, and the full environ dump for secret rotation.

#### Containment sequence

1. Block the bad destination IPs at the host firewall, then flush conntrack so existing connections die
2. Scale the compromised service to zero (`docker service scale NAME=0`). Do not `docker stop` alone under Swarm, Swarm will respawn the task
3. Rotate every secret that was in the container environment (see Layer 5 order)
4. Identify the entry vector (framework CVE, app code bug, supply chain) from logs and process tree
5. Patch the vulnerability
6. Rebuild the image from clean source with the fix applied
7. Redeploy with any missing container controls now in place

---

## Control Checklist

Use this checklist during code review, PR approval, or deployment review. An LLM assistant reviewing a repo should report which items are present, missing, or unverifiable.

### Dependencies
- [ ] `next` is pinned to the latest patched version for its minor line (as of April 2026: `16.2.3` for new projects, or minimum-safe patch per Layer 1)
- [ ] `react` and `react-dom` are at patched versions (19.0.1, 19.1.2, 19.2.1, or later within each line)
- [ ] `npm audit --production --audit-level=high` passes with zero findings
- [ ] CI runs `npm audit` and fails the build on high or critical findings
- [ ] Dependabot or Renovate is enabled on the repo

### Application code
- [ ] No `child_process.exec` or `execSync` with user-controlled input
- [ ] No `eval` or `new Function` with user input
- [ ] `proxy.ts` (Next.js 16) or `middleware.ts` (Next.js 15) strips `x-middleware-subrequest`
- [ ] `next.config.ts` sets `poweredByHeader: false`
- [ ] `next.config.ts` sets security response headers
- [ ] File upload handlers validate filenames against an allowlist regex, not a denylist
- [ ] If the app uses `rewrites` to proxy to an external backend, check Next.js version is patched against CVE-2026-29057

### Container
- [ ] Dockerfile uses `npm ci --ignore-scripts`
- [ ] Dockerfile creates a non-root user and runs the app as that user
- [ ] Dockerfile applies `chmod -R a-w /app` before switching to the app user
- [ ] Runtime config uses `read_only: true` with size-limited `noexec` tmpfs mounts
- [ ] Runtime config sets `no-new-privileges: true`
- [ ] Runtime config drops all Linux capabilities
- [ ] Final image is based on a minimal runtime (alpine, distroless, or standalone output)

### Network
- [ ] Docker is configured with `"iptables": false` and UFW `DEFAULT_FORWARD_POLICY=ACCEPT` (or equivalent egress control is in place)
- [ ] Egress is allowlisted, or at minimum, mining pool ports are alarmed on
- [ ] Management dashboards are behind a VPN, not publicly exposed
- [ ] Internal services do not have publicly-issued TLS certs (to avoid CT log exposure)

### Secrets
- [ ] `.env.local` and equivalents are in `.gitignore`
- [ ] Service role and admin API keys are scoped to least privilege
- [ ] Credentials have a documented rotation schedule
- [ ] No credentials appear in `console.log` or structured log output

### Detection
- [ ] Reverse proxy access logs are retained for 30+ days outside the container
- [ ] CPU monitoring and alerting is enabled per container
- [ ] An on-call process is documented for responding to suspected compromise

---

## Hardening Must Be Applied Per-Repo

One hard lesson: hardening applied to one repo does not protect other repos on the same host. Every Next.js repo deployed on shared infrastructure must meet this baseline. To keep it consistent:

- Maintain a shared base Dockerfile in a common repo, pulled into each service via a template or `FROM` directive
- Use a reusable CI workflow for dependency auditing that every repo can include
- Bake the security controls above into a deployment template (Dokploy app spec, Compose file, Swarm stack)
- Schedule a monthly review to confirm every deployed service still meets the checklist

---

## Using This Document as LLM Reference

When an LLM assistant is asked to review a Next.js repo or modify its Dockerfile, deployment config, or dependencies, it should:

1. Compare the repo's state against the Control Checklist
2. Call out every unchecked item, categorized by layer
3. For the Dependencies layer, check the installed `next` version against the Known Critical CVEs list AND against the most recent advisories at https://github.com/vercel/next.js/security/advisories and releases at https://github.com/vercel/next.js/releases. The CVE list in this doc is a snapshot, not a live feed
4. If this document's "Current recommended Next.js version" date is more than one month old, explicitly note that the recommendation may be stale and verify against upstream
5. Propose concrete code changes (Dockerfile, `proxy.ts` or `middleware.ts` depending on Next.js version, `next.config.ts`, deployment YAML) to fix gaps, matching the patterns in this document
6. Flag any `exec`, `spawn`, `eval`, or `new Function` usage in the app code for manual review, even if inputs look constant
7. Never assume that pinning a dependency makes it safe, always cross-check against current advisories
