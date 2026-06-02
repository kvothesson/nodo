# nodo — instrucciones para Codex

## Triggers — cuando aplicar estas instrucciones

Aplicar cuando el usuario diga: /nodo, cargar contexto, cargar mi perfil, cargar memoria, arrancar sesión, dame mi contexto.

---


# Skill: /nodo

Leé `memory/MEMORY.md` para ver qué archivos existen, luego leé los relevantes según $ARGUMENTS.

## Qué leer según $ARGUMENTS

**Sin argumentos:** leé todo — MEMORY.md + todos los archivos listados en él.

**Con argumento:** leé solo los archivos cuyo nombre contenga "$ARGUMENTS" (ej: `/nodo trabajo` lee `project_trabajo.md`).

## Cómo presentar

Después de leer, mostrá un brief con esta estructura:

---
### Nodo cargado

**Quién sos:** [2 líneas del perfil user]

**Proyectos activos:**
- [nombre] — [estado en una línea]

**Próxima acción pendiente:** [si existe en algún archivo]

**Inbox:** [N items / vacío]

---

Después preguntá: *¿En qué trabajamos?*

No hagas nada más hasta que el usuario responda.

## Si falta algún archivo

Cargá lo que haya. Mencioná brevemente qué falta sin interrumpir el flujo.
