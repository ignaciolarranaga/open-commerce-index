---
title: Otros asistentes y agentes
description: Usar OpenCommerceIndex con cualquier agente que pueda leer archivos públicos.
nav: connect/
client: other-agents
status: manual
---
# Otros asistentes y agentes

:::status
:::

Cualquier agente que pueda leer archivos públicos en la web puede usar el directorio sin instalar nada:

:::steps
1. Leé el índice raíz: `https://ignaciolarranaga.github.io/open-commerce-index/index.json`. Indica la versión del esquema, la fecha de generación y un archivo por país.
2. Leé el archivo del país, por ejemplo `uy.json`, que contiene todas las fichas de tiendas con sus categorías, cobertura de entrega y rutas de acceso.
3. Para cada tienda candidata, seguí el campo `access`: fuentes estructuradas primero, después la plantilla de búsqueda, y respetá `robots` y `bot_protection`.
4. Presentá título, modelo, precio tal como se muestra, disponibilidad, enlace y hora de consulta, y distinguí entre "sin resultados" y "no se pudo consultar".
:::

Las instrucciones completas están en la skill `shop` del [repositorio del plugin](https://github.com/ignaciolarranaga/open-commerce-plugin). Podés pegarlas en cualquier asistente con navegación. La página [para desarrolladores y agentes](../../agents/) describe los archivos y el esquema.
