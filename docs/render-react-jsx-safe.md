# How Rendered JSX is Sandboxed

Artifacts contain user-supplied JSX that gets executed as JavaScript. This is inherently dangerous — a malicious artifact could attempt to steal cookies, access the parent page, or call server APIs. This document explains the security boundaries that prevent that.

## The rendering pipeline

1. Artifact code is stored in SQLite as a raw string
2. On render, the code is encoded with `encodeURIComponent()` and embedded into an HTML template (`src/lib/render-template.ts`)
3. The HTML is served by `/render/[slug]` and loaded inside an `<iframe>` (`src/components/IframePreview.tsx`)
4. Inside the iframe, the code is decoded, transpiled by Babel, and executed

## Defense 1: Iframe sandbox

The iframe uses a restrictive sandbox:

```html
<iframe src="/render/{slug}" sandbox="allow-scripts" />
```

`allow-scripts` is the **only** permission granted. Critically, `allow-same-origin` is **omitted**. This means the browser assigns the iframe a **unique opaque origin** — it is treated as a completely different site from the parent page, even though the URL is on the same domain.

### What the sandbox blocks

| Action | Blocked? | Why |
|--------|----------|-----|
| Access parent DOM (`window.parent`, `top.document`) | Yes | Cross-origin, blocked by same-origin policy |
| Read cookies (`document.cookie`) | Yes | Opaque origin has no cookie jar |
| Access localStorage / sessionStorage | Yes | Scoped to the opaque origin, not the real domain |
| Send authenticated API requests | Yes | JWT cookie not sent on cross-origin requests (SameSite=Lax default) |
| Navigate the parent page | Yes | No `allow-top-navigation` |
| Open popups or new windows | Yes | No `allow-popups` |
| Submit forms | Yes | No `allow-forms` |
| Use `postMessage` to parent | Partially | Can call it, but parent doesn't listen for messages |

### What the sandbox allows

- JavaScript execution (required to render React components)
- DOM manipulation within the iframe
- Outbound network requests to external URLs (subject to CORS on the remote server)
- CPU/memory usage within normal browser tab limits

## Defense 2: Code encoding

User code is never interpolated directly into the HTML template. Instead:

```typescript
const encodedCode = encodeURIComponent(code);
// Embedded as: var code = decodeURIComponent("${encodedCode}");
```

This prevents the artifact code from breaking out of the JavaScript string literal and injecting arbitrary HTML or script tags into the template. Characters like `"`, `<`, `>`, and `\` are all percent-encoded.

## Defense 3: Private artifact auth

Private artifacts require a valid JWT to render. The `/render/[slug]` endpoint verifies the token server-side before returning any HTML. Without a valid token, private artifacts return 401.

## Remaining risks

The sandbox isolates artifacts from the parent app, but does not prevent all abuse:

- **Outbound requests** — Code can `fetch()` external URLs (though CORS on the remote end may block it). This could be used for data exfiltration of information visible within the iframe itself (which is only the artifact's own code).
- **Phishing UI** — Code could render fake login forms or misleading content within the iframe bounds.
- **Resource abuse** — Code could run CPU-intensive loops or allocate large amounts of memory, though this only affects the iframe's process.
- **No CSP header** — The render endpoint does not set a `Content-Security-Policy` header, so the iframe can load scripts from any CDN.

None of these risks allow access to the parent application's auth tokens, user data, or server-side resources.
