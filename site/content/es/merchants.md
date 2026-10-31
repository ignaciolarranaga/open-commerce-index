---
title: Para tiendas
description: Cómo listar tu tienda en OpenCommerceIndex para que los asistentes de IA la encuentren, qué publicamos y cómo funciona la revisión.
nav: merchants/
---
# Para tiendas

Listar tu tienda es gratis y toma unos minutos. No necesitás integrar nada: describimos tu tienda y cómo buscar en tu sitio, y los asistentes que usan el directorio la incluyen cuando alguien pide algo que vendés.

:::actions
[Agregar mi tienda](https://github.com/ignaciolarranaga/open-commerce-index/issues/new?template=add-store.yml) [Corregir una ficha](https://github.com/ignaciolarranaga/open-commerce-index/issues/new?template=update-store.yml)
:::

## Qué publicamos de tu tienda

- Nombre, sitio web, una descripción breve de lo que vendés y las categorías.
- Dónde entregás y si hay retiro en local, según lo que indica tu propio sitio.
- Cómo puede buscar un asistente en tu sitio: la dirección de tu buscador, si publicás un listado de productos, un `llms.txt`, un perfil UCP o un servidor MCP, y qué dice tu `robots.txt`.
- Las fuentes públicas de donde salió cada dato y las fechas.

## Qué no publicamos

Precios, stock, catálogos completos, datos de clientes ni credenciales. Los asistentes consultan tu sitio en vivo cada vez; nosotros sólo decimos dónde y cómo. Si tu sitio pide a los asistentes que no lo rastreen, lo respetamos y lo indicamos en la ficha.

## Cómo se agrega una tienda

:::steps
1. Completá el [formulario de alta](https://github.com/ignaciolarranaga/open-commerce-index/issues/new?template=add-store.yml). Necesitás una cuenta de GitHub, pero no conocimientos técnicos. El formulario es público: no incluyas datos privados.
2. Un mantenedor verifica que la tienda existe, qué vende y cómo se puede buscar en el sitio, y prepara la ficha.
3. La ficha se revisa como cualquier cambio del directorio y, al aprobarse, aparece en este sitio y en los archivos que leen los asistentes, normalmente en pocos días.
:::

Cualquiera puede proponer una tienda, no sólo su dueño. Si representás a la tienda y querés que la ficha lo indique, usá el [formulario de reclamo](https://github.com/ignaciolarranaga/open-commerce-index/issues/new?template=claim-store.yml); te pediremos una prueba de control del dominio. Para pedir la baja, usá el [formulario de baja](https://github.com/ignaciolarranaga/open-commerce-index/issues/new?template=remove-store.yml).

## Cómo ayudar a que te encuentren mejor

- Que tu buscador funcione con una dirección simple, por ejemplo `/buscar?q=producto`, y muestre resultados en el HTML.
- Publicar un `llms.txt` con qué vendés, dónde entregás y cómo buscar. Varias tiendas uruguayas ya lo hacen.
- Permitir en `robots.txt` a los agentes que actúan en nombre de una persona.
- Incluir el código de modelo en los títulos de los productos.

## Qué significa estar listado

Estar en el directorio significa que los usuarios que conectaron su asistente pueden recibir tu tienda entre las opciones cuando piden algo que vendés. No garantiza visitas ni ventas, y no es una recomendación nuestra: la ficha describe cómo encontrar información, no si conviene comprar.
