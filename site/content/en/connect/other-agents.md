---
title: Other assistants and agents
description: Use OpenCommerceIndex with any agent that can read public files.
nav: connect/
client: other-agents
status: manual
---
# Other assistants and agents

:::status
:::

Any agent that can read public files on the web can use the directory without installing anything:

:::steps
1. Read the root index: `https://ignaciolarranaga.github.io/open-commerce-index/index.json`. It states the schema version, the generation date and one file per country.
2. Read the country file, for example `uy.json`, which holds every store profile with categories, delivery coverage and access paths.
3. For each candidate store, follow the `access` field: structured sources first, then the search template, and respect `robots` and `bot_protection`.
4. Present title, model, price as shown, availability, link and retrieval time, and tell "no results" apart from "could not check".
:::

The full instructions live in the `shop` skill of the [plugin repository](https://github.com/ignaciolarranaga/open-commerce-plugin). You can paste them into any assistant with browsing. The [developers and agents](../../agents/) page describes the files and the schema.
