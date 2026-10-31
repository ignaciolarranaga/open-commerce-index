---
title: Claude (web and desktop)
description: Upload the OpenCommerceIndex shopping skill to Claude.ai as a custom skill.
nav: connect/
client: claude-ai
status: manual
---
# Claude (web and desktop)

:::status
:::

Claude.ai accepts custom skills uploaded from its settings. This is available on paid plans; the free plan does not enable skills.

:::steps
1. Download `open-commerce-skill-shop.zip` from the [latest plugin release](https://github.com/ignaciolarranaga/open-commerce-plugin/releases/latest).
2. In Claude.ai open **Settings → Capabilities → Skills** and choose **Upload skill**. Select the downloaded file.
3. Turn on web search in the conversation and ask, for example: "Where can I get a 15-inch Lenovo IdeaPad in Uruguay?"
:::

Claude only opens addresses that already appeared in the conversation or in search results, so the skill combines the index addresses with web searches limited to each store. This is the integration we are testing most; tell us how it went.

Uploaded skills do not sync automatically: when a new version is released, upload the file again.
