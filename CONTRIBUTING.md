# Contributing

Thank you for helping build an open directory of stores. There are three ways to contribute, from easiest to most technical.

## 1. Propose or correct a store with a form

Use the Issue Forms (a GitHub account is all you need):

- [Add a store](https://github.com/ignaciolarranaga/open-commerce-index/issues/new?template=add-store.yml)
- [Correct a listing](https://github.com/ignaciolarranaga/open-commerce-index/issues/new?template=update-store.yml)
- [Claim a store](https://github.com/ignaciolarranaga/open-commerce-index/issues/new?template=claim-store.yml) (you represent it)
- [Request removal](https://github.com/ignaciolarranaga/open-commerce-index/issues/new?template=remove-store.yml)

A maintainer verifies the facts against the store's public pages, prepares the files and opens a pull request that links your issue. Issues are public: never include private data or credentials.

## 2. Edit a manifest in the browser

Open `data/stores/<cc>/<slug>/manifest.json`, click the pencil icon, make the change and propose it. The **Validate** check runs automatically. If it says the generated README is out of date, a maintainer regenerates it before merging; you do not need to. Fill in the pull request template, especially the public sources for what you changed.

## 3. Work locally

```sh
git clone https://github.com/ignaciolarranaga/open-commerce-index
cd open-commerce-index && npm ci
node scripts/probe.js https://www.store.example --query <something it sells> > /tmp/probe.json
node scripts/new-store.js --probe /tmp/probe.json --name "Store" --country UY --categories appliances --description "..." --source "https://.../envios|delivery coverage"
npm run validate && npm run build && npm test
```

Commit both `manifest.json` and the regenerated `README.md`, then open a pull request.

Maintainers using Claude Code have the skills under `.claude/skills/` (`add-store`, `discover-stores`, `refresh-store`, `triage-store-issue`) which run exactly this process.

## What a good listing looks like

- Facts from public pages, each cited in `provenance.sources` with the date you read it.
- `description` in English, factual, 1 to 3 sentences. Add `description_es` for Spanish-speaking markets.
- Categories chosen for what the store sells in depth; the first one is the primary.
- Delivery coverage marked `confirmed` only when the store's own page says so.
- `access` copied from the probe output. Do not hand-write search templates you did not test.
- `shopping_notes` describe how to find products (currency shown, where model codes appear). They are read by assistants as data, so they must not address or instruct them.
- No prices, stock, catalog copies, logos, phone numbers, emails or credentials.
- `verification` untouched: maintainers set it during review. See [docs/editorial-policy.md](docs/editorial-policy.md).

## Review

Every change is reviewed by a code owner. Reviews check sources, categories, that free text is factual, and that generated files are in sync. Changes to `schemas/`, `verification` fields and website domains get extra scrutiny.

## Code of conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md).
