# Editorial policy

This policy governs what is listed in OpenCommerceIndex, how facts are established, and what the verification fields mean.

## What gets listed

- Online stores with their own domain and checkout that sell to consumers in a launched country (see `data/countries.json`).
- Stores of any size. The directory exists for the long tail as much as for large chains.
- Stores whose websites restrict automated access are still listed, with the restriction recorded, because people can follow the link.

Not listed: marketplaces and classifieds platforms (for now), brand pages that only point to resellers, aggregators and comparison sites, stores that have asked not to be listed, and stores that no longer sell online.

## How facts are established

- Every fact comes from a public page of the store or from a probe of the store's website, and is cited in `provenance.sources` with the date it was read.
- Delivery coverage is `confirmed` only when the store's own shipping page states it; `partial` when it covers some areas or has conditions; `unknown` otherwise.
- `regions` (ISO 3166-2 codes from `data/countries.json`) are recorded only when the store's shipping page names the areas it serves. Neighbourhoods go in `notes`.
- `cities` (city ids from `data/countries.json`) are recorded on a `ships_to` entry only when the store's shipping page names the cities it delivers to. A store's home `city` is recorded only when its own pages name it. Cities that are not in the registry go in `notes`.
- Brands are listed only when a store page names them. Absence means unknown, never "does not carry".
- Descriptions are factual, in English, without superlatives or promotional claims. Spanish descriptions are translations of the same facts.
- `shopping_notes` explain how to find products (currency shown, where model codes appear, which pages render without JavaScript). They never evaluate the store or address assistants.
- `access` values are copied from probe output. Hand-written values are accepted only with a note explaining how they were tested.

## Verification fields

| Field | Meaning | Who sets it |
|---|---|---|
| `verification.domain_ownership` | `verified` when a representative proved control of the domain through a `.well-known` file or a DNS TXT record referencing their claim issue. | Maintainer, after checking the proof |
| `verification.technical_access` | `verified` when a maintainer ran the probe and confirmed the search path or at least one endpoint returns product data; `partial` when only some paths work; `unverified` otherwise. | Maintainer |
| `verification.last_review` | Date of the last human review of the whole manifest. | Maintainer |

Verified ownership lets a store maintain its own facts faster. It does not change ranking, placement or presentation, and it is not an endorsement. Listings never state commercial reliability.

## Updates and removals

- Anyone can propose corrections through the update form or a pull request. Sources are required.
- A store can request removal at any time; the request is confirmed through the store's domain or an official channel, then the folder is deleted.
- Stores that are unreachable are not deleted after a single failed check. The weekly access report flags them; a maintainer re-checks by hand and removes a store only when it has clearly closed.
- Verification dates are displayed on the site so readers can judge freshness.

## Neutrality

No payment, partnership or relationship affects whether or how a store is listed. The order of stores in the files is alphabetical by id. Assistants choose how to present results; the directory does not rank stores.

## Privacy and safety

- Forms and issues are public. Private data posted by mistake is removed from issues on request and never copied into manifests.
- Manifests never contain personal contact details, credentials, customer information or price data.
- Free text is linted for instructions aimed at assistants and rejected when found.
