---
title: Codex
description: Instalar la skill de compras de OpenCommerceIndex en Codex.
nav: connect/
client: codex
status: experimental
---
# Codex

:::status
:::

Codex instala plugins desde un catálogo alojado en GitHub, con el mismo paquete que Claude Code.

:::steps
1. Agregá el marketplace: `codex plugin marketplace add ignaciolarranaga/open-commerce-plugin`
2. Instalá el plugin: `codex plugin add open-commerce@opencommerceindex`
3. Abrí un hilo nuevo y pedí tu producto indicando el país de entrega.
:::

Para actualizar, refrescá el catálogo con `codex plugin marketplace upgrade opencommerceindex` y volvé a ejecutar el comando de instalación.
