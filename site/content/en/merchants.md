---
title: For stores
description: How to list your store in OpenCommerceIndex so AI assistants find it, what we publish and how review works.
nav: merchants/
---
# For stores

Listing your store is free and takes a few minutes. There is nothing to integrate: we describe your store and how to search your site, and assistants that use the directory include it when someone asks for something you sell.

:::actions
[Add my store](https://github.com/ignaciolarranaga/open-commerce-index/issues/new?template=add-store.yml) [Correct a profile](https://github.com/ignaciolarranaga/open-commerce-index/issues/new?template=update-store.yml)
:::

## What we publish about your store

- Name, website, a short description of what you sell and the categories.
- Where you deliver and whether pickup is available, as stated on your own site.
- How an assistant can search your site: your search page address, whether you publish a product listing, an `llms.txt`, a UCP profile or an MCP server, and what your `robots.txt` says.
- The public sources behind each fact and the dates.

## What we do not publish

Prices, stock, full catalogs, customer data or credentials. Assistants query your site live every time; we only say where and how. If your site asks assistants not to crawl it, we respect that and say so in the profile.

## How a store is added

:::steps
1. Fill in the [listing form](https://github.com/ignaciolarranaga/open-commerce-index/issues/new?template=add-store.yml). You need a GitHub account, but no technical knowledge. The form is public: do not include private data.
2. A maintainer verifies that the store exists, what it sells and how the site can be searched, and prepares the profile.
3. The profile is reviewed like any change to the directory and, once approved, appears on this site and in the files assistants read, usually within a few days.
:::

Anyone can propose a store, not only its owner. If you represent the store and want the profile to say so, use the [claim form](https://github.com/ignaciolarranaga/open-commerce-index/issues/new?template=claim-store.yml); we will ask for proof of control over the domain. To request removal, use the [removal form](https://github.com/ignaciolarranaga/open-commerce-index/issues/new?template=remove-store.yml).

## How to help assistants find you

- Make your search work from a simple address, for example `/search?q=product`, and show results in the HTML.
- Publish an `llms.txt` stating what you sell, where you deliver and how to search. Several Uruguayan stores already do.
- Allow agents acting on behalf of a person in `robots.txt`.
- Include the model code in product titles.

## What being listed means

Being in the directory means users who connected their assistant can get your store among the options when they ask for something you sell. It guarantees no visits or sales, and it is not a recommendation from us: the profile describes how to find information, not whether to buy.
