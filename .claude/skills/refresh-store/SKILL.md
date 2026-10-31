---
name: refresh-store
description: Re-check one or all OpenCommerceIndex stores against their live websites and propose manifest updates for review. Use when asked to refresh, re-verify, re-probe, update access details, or act on a weekly access report. Compares probe output with the manifest's access and fulfillment fields and updates last_checked; never deletes a store for a temporary outage.
---

# Refresh a store

## Inputs

- A store id (for example `uy-zonatecno`) or `all`. Optionally the access report issue to act on.

## Steps

1. **Probe** with `node scripts/probe.js <website> --query <term>` using a term from the store's primary category (or run `node scripts/check-access.js --only <id> --out /tmp/report.md` for the comparison table).
2. **Compare** with the manifest's `access`: platform, rendering, bot protection, robots verdicts, search status and template, verified endpoints. Also re-open the shipping and pickup pages listed in `provenance.sources` and compare with `fulfillment`.
3. **Decide per difference:**
   - A newly verified endpoint or search template: add it.
   - A previously verified path now failing: re-run the probe once more later in the session; if it still fails, set its `status` to `failing` and add a short note. Do not remove it yet.
   - Bot protection or robots changes: record the new state and adjust `shopping_notes` if they describe access.
   - A homepage that is down: do not change `access`; report the outage. A store is removed only after it stays unreachable for weeks or asks to be removed.
4. **Edit the manifest** by hand (small, precise edits), set `access.last_checked` to today, add a `provenance.sources` entry for any new page you relied on with today's date, and leave `verification` alone.
5. **Validate and build** with `npm run validate` and `npm run build`, then summarise what changed and why, with the evidence, so a reviewer can approve it quickly.

## Rules

- A probe from your machine and a probe from GitHub Actions can differ (datacenter addresses get blocked). Prefer your own result but mention both when you have both.
- Never mark `verification.technical_access` yourself; the reviewer does that.
- Keep the diff minimal. Do not rewrite descriptions during a refresh unless the store clearly changed what it sells.
