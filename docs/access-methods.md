# Store access cookbook

How the ecommerce platforms common in the directory expose search and product data, and what the probe looks for. Everything here is a candidate; only probe-verified paths go into a manifest.

| Platform | Fingerprint | Search page | Structured sources | Notes |
|---|---|---|---|---|
| Fenicio | `fenicio` in scripts | `/catalogo?q={query}` | sitemap at `/sitemap`; some stores publish `/llms.txt` | Common in Uruguay. Search results are server-rendered with prices in the HTML. |
| Shopify | `cdn.shopify.com`, `Shopify.theme` | `/search?q={query}&type=product` | `/search/suggest.json?q={query}&resources[type]=product`, `/products.json?limit=250`, `/.well-known/ucp`, storefront MCP at `/api/mcp`, `/llms.txt` | Richest structured access. Product JSON includes variants and prices. |
| VTEX | `vtexassets.com`, `vtex` headers | `/{query}?_q={query}&map=ft`, `/busca?ft={query}`, `/s?q={query}` | `/api/io/_v/api/intelligent-search/product_search/?query={query}`, `/api/catalog_system/pub/products/search?ft={query}` | Storefronts are usually client-rendered (FastStore/Gatsby); the APIs may be disabled per account. |
| WooCommerce | `woocommerce` classes | `/?s={query}&post_type=product` | `/wp-json/wc/store/v1/products?search={query}` | Store API is public by default. |
| Magento | `Magento_*`, `/static/version…/frontend/` | `/catalogsearch/result/?q={query}` | — | robots.txt often disallows `/*?`; respect it. |
| Tiendanube | `tiendanube`, `nuvemshop` | `/search/?q={query}` | — | Common in Argentina and Brazil. |
| Custom | — | discovered from the search form or common paths | `/llms.txt`, `/faq-ai.txt` when published | The probe reads `<form>` elements with a search input and tests common paths. |

## What the probe records

- `platform`, with the evidence it matched.
- `rendering`: `server` when the search page HTML contains the query term several times beyond echoing the query itself; `client` when the homepage has almost no visible text; `mixed` otherwise.
- `bot_protection`: `challenge` for Cloudflare-style interstitials, `blocked` for 401/403/429 without a challenge, `none` for 2xx.
- `robots`: verdict for `*` and for assistant user agents (`ChatGPT-User`, `Claude-User`, `Perplexity-User`) on the search path. The probe itself obeys `OpenCommerceIndexProbe` and `*` rules and skips paths they disallow.
- `search.url_template` and `status`: `verified` only when a real query produced results in the HTML.
- `endpoints`: JSON search, product feeds, llms.txt-style guides, UCP profiles, MCP servers and sitemaps, each `verified` or `unverified`.

## Reading prices in Uruguay

Stores write Uruguayan pesos as `$`, `$U` or `UYU` and US dollars as `U$S`, `US$` or `USD`. Electronics and appliances are often priced in dollars. Record the currencies the store shows in `currencies`; the skill reports prices exactly as shown.

## Limits

- Probes from GitHub Actions runners are often blocked where a person's assistant is not. Scheduled reports are prompts for a human, never verdicts.
- The probe never logs in, never solves challenges and sends about a dozen requests per store with pauses.
- Platforms change. When a store's platform or paths move, run the refresh-store skill and update the manifest with a new `last_checked` date.
