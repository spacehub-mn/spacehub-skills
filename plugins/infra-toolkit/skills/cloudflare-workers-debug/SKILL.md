---
name: cloudflare-workers-debug
description: Use this skill when debugging a Cloudflare Worker — bundle size errors, memory limit hits, service binding issues, IP forwarding problems, or unexpected 1101 / 1102 errors at the edge. Covers wrangler tail, deploy diagnostics, the worker startup error page, and common Worker runtime gotchas. Trigger phrases include "worker exceeded memory", "1101 error", "wrangler tail", "service binding", "cf-connecting-ip", "bundle too large".
when_to_use: User is reading a wrangler error, a 1101/1102/1027 page, or output from `wrangler tail`; user mentions Worker memory limits, request CPU time, or service bindings; user is debugging unexpected client IP values in a Worker.
---

# Cloudflare Workers Debugging

## When to use this skill

- A Worker is throwing `1101` (script error), `1102` (CPU exceeded), or `1027` (Worker daily request limit) at the edge.
- `wrangler deploy` rejected the bundle for size (>10 MB compressed for paid plans, >3 MB for free).
- A service binding to another Worker returns unexpected results or 500s.
- The Worker reads `cf-connecting-ip` but gets the wrong value (proxy chain, DO calls, internal forwards).

## Instructions

1. **Capture the failure shape first.** Get the exact error code, the request URL, and a `wrangler tail` excerpt covering the failing request. Do not speculate before seeing tail output.
2. **For 1101**, find the unhandled exception. The tail will include the JS stack. Common: top-level `await` rejection, missing env binding, fetch to internal hostname that does not resolve from the edge.
3. **For 1102 (CPU exceeded)**, identify the hot path. CPU time on the free tier is 10ms; bundled paid plans give more but a single regex or JSON.parse on a multi-MB body still kills it. Suggest streaming, `request.json()` size limits, or moving work to a queue.
4. **For bundle size**, run `wrangler deploy --dry-run --outdir dist` and inspect `dist/`. Look for accidentally bundled `node_modules` (mark them external in `wrangler.toml` build), large WASM blobs, or polyfills.
5. **For service bindings**, confirm both Workers are deployed to the same account, the binding name in `wrangler.toml` matches the runtime accessor, and the bound Worker exports a default `fetch` handler (or is using the new RPC class export).
6. **For `cf-connecting-ip` confusion**, remember: bindings, Durable Object subrequests, and `fetch()` to your own Worker do not preserve the original client IP. Read it on the entry Worker and forward it explicitly via header if downstream needs it.

## Examples

**Trigger:** "1101 error on prod worker after deploy"
**Response shape:** Ask for `wrangler tail` excerpt, then read the stack to identify the unhandled exception. If env var is missing, point to the binding in `wrangler.toml` vs dashboard.

**Trigger:** "service binding returns undefined"
**Response shape:** Verify both deploys, check binding wiring in `wrangler.toml`, and inspect the bound Worker's exports.

## Notes

- `wrangler tail` only shows live traffic — for an issue that has stopped reproducing, ask the user to replay a request.
- Workers do not have a filesystem; bundle assets via `[site]` or pull from R2.
- `console.log` in a Worker survives in tail but is dropped in production logs unless `tail` is attached or Logpush is set up.

<!-- TODO: Add Logpush + Workers Observability references once we publish the standard config. -->
