# CCG en este repo

Este proyecto usa **Contextual Capability Graph (CCG)**. El grafo está en `graph/graph.json`; los skills en `skills/`; los scripts compartidos en `primitives/`.

## Cómo hacer que el agente lo use

- **En Cursor**: hay una regla en `.cursor/rules/ccg.mdc` con `alwaysApply: true`. En cada conversación en este workspace el agente debería cargar esa regla y seguir CCG (navegar por nodos, proponer en `proposals/`, log en `logs/`).
- **En otra herramienta o conversación**: al iniciar, indica algo como: *"Carga `ccg/graph/graph.json`. Este repo usa CCG: navega por nodos según lo que pida el usuario, no modifiques el grafo sin propuesta en `ccg/proposals/` y aprobación, y escribe en `ccg/logs/YYYY-MM-DD.md` al final de la sesión."*

## Estructura

- `graph/graph.json` — nodos y edges.
- `skills/<nombre>/SKILL.md` — qué es cada capacidad y cuándo activarla.
- `primitives/*.py` — scripts reutilizables.
- `references/*.md` — documentación compartida.
- `proposals/` — cambios propuestos (requieren aprobación).
- `logs/` — qué pasó cada día.
