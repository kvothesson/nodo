# SKILL: youtube-channel-stats

## What it is
Capability to:
- Autenticar al usuario contra la YouTube Data API v3 (canal propio).
- Exportar todas las estadísticas del canal y de cada video a un CSV.
- Generar un informe en Markdown con:
  - Resumen general (vistas totales, likes, comentarios, promedios).
  - Top N videos por vistas y por likes.
  - Ranking por engagement (likes/vistas).
  - Distribución de vistas por rangos.

## When to activate
- Cuando el usuario pida:
  - "obtener estadísticas de mi canal de YouTube"
  - "sacar métricas/analytics de mi canal de YouTube"
  - "ver cuáles son mis videos más vistos/likeados"
  - "analizar el rendimiento de mi canal de YouTube"
- El canal debe ser **el del usuario autenticado** (no un canal externo).

## Graph node
- id: `analytics/youtube-channel-stats`
