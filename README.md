# OpenCommerceIndex

An open directory of online stores that shopping assistants and agents can read.

**Shoppers and stores:** the website explains everything without code and in Spanish and English → **https://ignaciolarranaga.github.io/open-commerce-index/**

- Connect your assistant (ChatGPT, Claude, Claude Code, Codex, Cursor or others): [installation guides](https://ignaciolarranaga.github.io/open-commerce-index/en/connect/).
- List your store: [Add a store](https://github.com/ignaciolarranaga/open-commerce-index/issues/new?template=add-store.yml) (a GitHub account is enough; no coding).
- Browse the [directory](https://ignaciolarranaga.github.io/open-commerce-index/en/directory/).

## What this repository holds

The directory's data, its schema, the scripts that validate and publish it, and the source of the website. Each store has a `manifest.json` describing what it sells, where it delivers and how an assistant can query its website, plus a generated `README.md`. No prices, stock or catalogs are stored here; assistants look those up live on each store's site.

Public files (served from GitHub Pages, absolute URLs inside):

| URL | Contents |
|---|---|
| `https://ignaciolarranaga.github.io/open-commerce-index/index.json` | Root index: countries, counts, addresses |
| `https://ignaciolarranaga.github.io/open-commerce-index/uy.json` | Every store profile for Uruguay |
| `https://ignaciolarranaga.github.io/open-commerce-index/stores/uy/<slug>.json` | One profile (also `.md`) |
| `https://ignaciolarranaga.github.io/open-commerce-index/categories.json` | Taxonomy with labels and synonyms |
| `https://ignaciolarranaga.github.io/open-commerce-index/schemas/store.schema.json` | Profile schema (JSON Schema 2020-12) |

The assistant skill that uses these files lives in the companion repository [open-commerce-plugin](https://github.com/ignaciolarranaga/open-commerce-plugin).

## Layout

```
data/
  categories.json            taxonomy (ids, es/en labels, synonyms)
  countries.json             launched countries with currency and language notes
  stores/<cc>/<slug>/        manifest.json (source of truth) + README.md (generated)
schemas/                     store, categories and index JSON Schemas
scripts/                     validate, build, probe, new-store, check-access, issue-to-branch, serve
site/                        website source: content/<lang>/*.md, i18n strings, styles, assets
docs/                        editorial policy and the store-access cookbook for contributors
.claude/skills/              curation skills for maintainers using Claude Code
.github/                     Issue Forms, PR template, CODEOWNERS, workflows
```

## Working on the data

```sh
npm ci
npm test              # unit tests, including a full site build and link check
npm run validate      # schema + cross-file rules for every manifest
npm run build         # regenerates store READMEs and dist/ (JSON files + site)
npm run serve         # serves dist/ locally at the Pages base path
node scripts/probe.js https://www.example.com.uy --query cafetera   # fingerprint a store
```

To add a store by hand: probe it, run `node scripts/new-store.js` (see its header for flags), then `npm run validate && npm run build` and open a pull request. [CONTRIBUTING.md](CONTRIBUTING.md) has the full checklist and the editorial rules are in [docs/editorial-policy.md](docs/editorial-policy.md).

## Licenses

Code: [Apache-2.0](LICENSE). Data under `data/` and the generated JSON files: [CC0 1.0](DATA-LICENSE). Store names and content quoted from store websites belong to their owners.
