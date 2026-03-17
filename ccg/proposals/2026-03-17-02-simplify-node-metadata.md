# Proposal: Simplify node metadata (drop runtime usage tracking)
Date: 2026-03-17
Triggered by: Realization that `usage_count` and `last_used` in `graph.json` are not being updated automatically and add complexity without real benefit right now.

## What happened
The initial CCG design for `graph.json` included per-node runtime metadata:
- `usage_count`
- `last_used`

The idea was that each time a node was used in a conversation, these fields (and edge weights) would be updated. In practice:
- We successfully modeled nodes, skills, primitives, and proposals.
- But we **did not** implement a generic, reliable mechanism to automatically bump `usage_count` / `last_used` whenever a node is used.
- As a result, values like `usage_count: 0` are misleading: the node *is* being used (e.g. `analytics/youtube-channel-stats`), but the counters stay at 0.

This adds cognitive load (“¿por qué usage_count está en 0 si lo usé?”) sin aportar valor real por ahora.

## Proposed change
Type: modify-node

**Goal:** Simplify node metadata and avoid lying metrics by dropping runtime usage from the core graph schema (or treating it as out-of-band).

### Current state (per node shape)

Nodes in `graph.json` currently follow the original schema:

- `id`
- `name`
- `description`
- `skill_path`
- `primitives`
- `references`
- `mcp`
- `usage_count`
- `last_used`
- `created`

### Proposed state

For now, **remove runtime usage fields from the required node shape** in `graph.json`, keeping the graph focused on structure, not telemetry:

- Keep:
  - `id`
  - `name`
  - `description`
  - `skill_path`
  - `primitives`
  - `references`
  - `mcp`
  - `created`
- Drop (or ignore going forward):
  - `usage_count`
  - `last_used`

Concretamente:

1. Update the conceptual schema (how we think of `graph.json`) to **not require** `usage_count` / `last_used`.
2. For existing nodes, we can:
   - Either remove those fields from each node.
   - Or agree they are deprecated and must be ignored by any logic that reads the graph.
3. If in the future we really need usage tracking:
   - Implement it as a **separate capability** (e.g. `analytics/ccg-usage-tracker`) with its own data store (another JSON under `ccg/`, or logs-only).

This keeps `graph.json` small, declarative, and easier to maintain manually.

### No code changes required right now

- Existing code that just reads the node’s `id`, `skill_path`, `primitives`, etc., seguirá funcionando incluso si `usage_count`/`last_used` desaparecen.
- We don’t have any primitive that depends on these fields, so dropping them is safe at this stage.

## Risk
- Very low:
  - The fields are currently **unused** and unmaintained.
  - Any future tooling that assumed their presence will need to be aware of the change, but today no such tooling exists.
- The only risk is losing the idea of “metrics in the graph”, but that idea was not implemented in a reliable way anyway.

## Rollback
If we later decide we want usage tracking baked into `graph.json`:
- Reintroduce `usage_count` and `last_used` into the node shape.
- Add a new primitive (e.g. `ccg/primitives/update_node_usage.py`) that:
  - Receives `node_id`,
  - Updates those fields,
  - And is called from skills that want to record usage.
- Optionally, backfill approximate statistics from `ccg/logs/*.md` if needed.

