---
title: Codex
description: Install the OpenCommerceIndex shopping skill in Codex.
nav: connect/
client: codex
status: experimental
---
# Codex

:::status
:::

Codex installs plugins from a catalog hosted on GitHub, using the same package as Claude Code.

:::steps
1. Add the marketplace: `codex plugin marketplace add ignaciolarranaga/open-commerce-plugin`
2. Install the plugin: `codex plugin add open-commerce@opencommerceindex`
3. Start a new thread and ask for your product, naming the delivery country.
:::

To update, refresh the catalog with `codex plugin marketplace upgrade opencommerceindex` and run the install command again.
