---
title: Claude Code
description: Install the OpenCommerceIndex shopping skill in Claude Code from the project marketplace.
nav: connect/
client: claude-code
status: experimental
---
# Claude Code

:::status
:::

Claude Code installs plugins from marketplaces hosted on GitHub. Ours is called `opencommerceindex` and the plugin is `open-commerce`.

:::steps
1. In a terminal, add the marketplace: `claude plugin marketplace add ignaciolarranaga/open-commerce-plugin`
2. Install the plugin: `claude plugin install open-commerce@opencommerceindex`
3. Start a new Claude Code session and ask, for example: "Find me a Philips LatteGo 5500 in Uruguay".
:::

Claude Code uses its web reading tool to query the stores. When a store only renders results with JavaScript, the skill first tries the structured sources listed in the store profile and, failing that, a web search limited to the store site.

To update: `claude plugin update open-commerce@opencommerceindex`. To remove: `claude plugin uninstall open-commerce@opencommerceindex`.
