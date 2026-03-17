# Proposal: YouTube channel analytics skill
Date: 2026-03-17
Triggered by: Conversation where the user requested automated YouTube channel statistics and analysis using Python.

## What happened
The user asked to obtain and analyze statistics from their authenticated YouTube channel, including:
- Obtener estadísticas generales del canal (vistas totales, suscriptores, cantidad de videos).
- Obtener estadísticas por video (vistas, likes, comentarios).
- Generar un análisis agregado (top por vistas, top por likes, engagement, distribución de vistas).

To solve this, we created ad-hoc Python scripts (`youtube_stats.py` y `analyze_youtube.py`) en la raíz del repositorio. These scripts behave like **primitives** that should be reusable and discoverable by future sessions, but they are not yet wired into the CCG graph and have no associated `SKILL.md` node.

## Proposed change
Type: new-node + new-primitive

We propose to formalize this capability as a CCG node plus proper primitives and references.

### New SKILL node

- Node id: `analytics/youtube-channel-stats`
- Name: `youtube-channel-stats`
- Description: Capability to authenticate against the YouTube Data API for the current user, export all channel and video statistics to CSV, and generate a Markdown analysis report (top videos, engagement, and distribution).
- Skill path: `ccg/skills/youtube-channel-stats/SKILL.md`
- Primitives:
  - `primitives/youtube_fetch_channel_and_videos.py`
  - `primitives/youtube_analyze_videos_csv.py`
- References:
  - `references/youtube-analytics.md` (high-level explanation of scopes, quotas, and typical questions to answer with the data)
- MCP: none (uses direct HTTP via Google client libraries instead of MCP)

#### SKILL.md content

```markdown
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
```

### New primitives

#### 1) `primitives/youtube_fetch_channel_and_videos.py`

- Script name and location:
  - `ccg/primitives/youtube_fetch_channel_and_videos.py`
- What it does:
  - Encapsulates the logic currently in `youtube_stats.py`:
    - Maneja la autenticación OAuth (YouTube Data API v3) con el canal del usuario.
    - Obtiene estadísticas del canal (snippet, statistics, contentDetails).
    - Recorre la playlist de uploads para obtener todos los IDs de video.
    - Llama a `videos().list` para obtener estadísticas por video en batches.
    - Guarda los resultados en `videos_stats.csv` (UTF-8, con cabeceras claras).
- Which nodes will use it:
  - `analytics/youtube-channel-stats`
  - Potencialmente futuros nodos de "content analytics" o "growth experiments" que reutilicen los datos brutos.

#### 2) `primitives/youtube_analyze_videos_csv.py`

- Script name and location:
  - `ccg/primitives/youtube_analyze_videos_csv.py`
- What it does:
  - Encapsulates la lógica actualmente en `analyze_youtube.py`:
    - Lee `videos_stats.csv`.
    - Calcula métricas agregadas (totales y promedios).
    - Calcula top por vistas, top por likes, y engagement filtrando por mínimo de vistas.
    - Calcula distribución de vistas por rangos.
    - Genera un archivo `analisis_canal.md` con tablas en Markdown.
- Which nodes will use it:
  - `analytics/youtube-channel-stats`
  - Otros nodos futuros de análisis que quieran extender el reporte (por ejemplo, comparaciones entre periodos).

### Edges to add to graph.json

Actualmente no existe un nodo más general de analytics en el grafo, así que por ahora se propone dejar este nodo como huérfano (sin edges) hasta que aparezca:
- Un nodo general `analytics/content-analytics` o similar, desde el cual este de YouTube se considere un caso específico.

Cuando exista ese nodo, debería agregarse un edge:
- From: `analytics/content-analytics`
- To: `analytics/youtube-channel-stats`
- Relationship type: `lleva-a`
- Reason: cuando el usuario pide analytics de contenido y especifica YouTube como canal, la ruta natural es ir al nodo especializado de YouTube.

## Risk
- Riesgo bajo a nivel de código: es básicamente una refactorización de scripts ya probados.
- Riesgo conceptual:
  - Si más adelante se agregan otros tipos de analytics (TikTok, Instagram, etc.), puede ser necesario reestructurar el dominio `analytics/` y mover este nodo bajo una jerarquía más general (por ejemplo `analytics/youtube/channel-stats`).
  - Los paths de los primitives cambiarán (de raíz a `ccg/primitives/`), por lo que cualquier referencia dura externa a CCG debería actualizarse.

## Rollback
- Eliminar el nodo `analytics/youtube-channel-stats` de `graph.json` si ya se hubiera agregado.
- Borrar `ccg/skills/youtube-channel-stats/SKILL.md` si ya se hubiera creado.
- Eliminar o mover de vuelta a la raíz los scripts:
  - `ccg/primitives/youtube_fetch_channel_and_videos.py`
  - `ccg/primitives/youtube_analyze_videos_csv.py`
- Eliminar `ccg/references/youtube-analytics.md` si se hubiera añadido.
