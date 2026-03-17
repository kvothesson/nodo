# YouTube Analytics (Data API v3)

## Scope
- **youtube.readonly**: leer estadísticas del canal y de los videos del usuario autenticado.

## Cuotas
- La API tiene cuota diaria (por proyecto en Google Cloud). Operaciones típicas:
  - `channels.list` (mine=true): 1 unidad.
  - `playlistItems.list`: 1 unidad por request (50 ítems).
  - `videos.list`: 1 unidad por request (hasta 50 IDs).
- Consultar [Quota calculator](https://developers.google.com/youtube/v3/determine_quota_cost) para detalles.

## Archivos en el proyecto
- `client_secret.json`: credenciales OAuth (Desktop) del proyecto en Google Cloud. No versionar si es sensible.
- `token.json`: token de acceso generado tras el primer login. No versionar.

## Preguntas que responde esta capacidad
- Vistas totales del canal y por video.
- Suscriptores y cantidad de videos.
- Top videos por vistas, likes, comentarios.
- Engagement (likes/vistas) y distribución de vistas por rangos.
