# nodo

Compatible con **Claude Code** y **OpenAI Codex** — contexto personal persistente entre sesiones.

## Qué hace

`/nodo` carga tu contexto completo al inicio de cualquier sesión. Claude arranca sabiendo quién sos, en qué estás trabajando y qué hay pendiente — sin que tengas que re-explicar nada.

## Instalación

```bash
claude --plugin-dir /ruta/a/nodo
```

### OpenAI Codex

No requiere instalación. Codex lee `AGENTS.md` automáticamente al abrirse en este directorio.

```bash
git clone https://github.com/kvothesson/nodo ~/nodo
cd ~/nodo
codex
```

## Setup

1. Cloná el repo
2. Copiá los archivos `.example.md` de `memory/` y sacales el `.example`
3. Completá con tu contexto (estos archivos son gitignored — nunca se suben)
4. Ejecutás `claude --plugin-dir .`
5. Usás `/nodo` al inicio de cada sesión

## Uso

```
/nodo              # carga todo el contexto
/nodo yo           # solo perfil personal
/nodo inbox        # solo inbox pendiente
```

Los argumentos los definís vos según tus proyectos en `memory/`.

## Privacidad

Los archivos de `memory/` con tus datos reales son gitignored por diseño.
Solo las plantillas `.example.md` se suben al repo.
Tu contexto nunca sale de tu máquina a menos que lo commiteés vos a un repo privado.
