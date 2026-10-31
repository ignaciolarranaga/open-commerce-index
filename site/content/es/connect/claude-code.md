---
title: Claude Code
description: Instalar la skill de compras de OpenCommerceIndex en Claude Code desde el marketplace del proyecto.
nav: connect/
client: claude-code
status: experimental
---
# Claude Code

:::status
:::

Claude Code instala plugins desde marketplaces alojados en GitHub. El nuestro se llama `opencommerceindex` y el plugin, `open-commerce`.

:::steps
1. En una terminal, agregá el marketplace: `claude plugin marketplace add ignaciolarranaga/open-commerce-plugin`
2. Instalá el plugin: `claude plugin install open-commerce@opencommerceindex`
3. Abrí una sesión nueva de Claude Code y pedí, por ejemplo: "Buscame una cafetera Philips LatteGo 5500 en Uruguay".
:::

Claude Code usa su herramienta de lectura web para consultar las tiendas. Si una tienda sólo muestra resultados con JavaScript, la skill intenta primero las fuentes estructuradas que figuran en la ficha y, si no hay, una búsqueda web acotada al sitio de la tienda.

Para actualizar: `claude plugin update open-commerce@opencommerceindex`. Para quitar: `claude plugin uninstall open-commerce@opencommerceindex`.
