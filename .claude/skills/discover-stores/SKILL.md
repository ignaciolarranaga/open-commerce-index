---
name: discover-stores
description: Find real online stores for a country and set of categories and shortlist them with evidence before adding them to OpenCommerceIndex. Use when asked to build initial coverage, find stores that sell a kind of product, expand a country, or check which stores are missing. Produces an evidence-backed shortlist and hands each accepted candidate to add-store.
---

# Discover stores

Goal: a shortlist of real, independent online stores for one country and a few categories, each with proof that it exists and sells what we think. Then add them one by one with the add-store skill.

## Inputs

- Country (ISO code, must exist in `data/countries.json`) and 1 to 4 category ids from `data/categories.json`.
- Optional target count (default 8) and exclusions.

## Steps

1. **Check existing coverage.** List `data/stores/<cc>/` and read the `categories` of each manifest so you do not propose duplicates.
2. **Search the web** in the local language with several formulations per category, for example `cafeteras tienda online uruguay`, `comprar notebook envío a todo el país uruguay`, `<brand> distribuidor oficial uruguay`, and product-specific queries like `Philips LatteGo 5500 uruguay`. Open the result pages. Prefer stores that appear in product searches, since those are the ones shoppers will actually hit.
3. **Qualify each candidate** by opening its own site:
   - It is a store with its own domain and checkout (not a marketplace listing, a brand's "where to buy" page, a classifieds site or an aggregator).
   - It sells the category in depth (dozens of products, not two).
   - It serves the target country (shipping or pickup page).
   - Record one evidence URL per claim.
4. **Reject** closed sites, sites that redirect to another country, pure B2B wholesalers unless the category is B2B. Sites whose `robots.txt` restricts assistants can still be listed, with the restriction noted.
5. **Produce the shortlist** as a table: name, website, categories, evidence URLs, why it matters (for example "primary Fenicio appliance chain", "Shopify store with structured endpoints"). Mark the platform if obvious. Aim for variety in platforms and store sizes; the directory needs the long tail, not only the biggest chains.
6. **Hand over.** For each accepted candidate run the add-store skill (one at a time, validating after each). Stop and ask before adding more than the target count.

## Rules

- Never invent a store or infer one from a brand name. If you cannot open the site, it is not a candidate.
- Do not copy marketing text into the shortlist; summarise what the store sells in your own words.
- Marketplaces (Mercado Libre and similar) are out of scope for now; note them separately if they come up.
- Keep the shortlist in the conversation. Do not create files other than manifests through add-store.
