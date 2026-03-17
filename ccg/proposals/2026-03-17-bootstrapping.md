# Proposal: Initial CCG bootstrap
Date: 2026-03-17
Triggered by: Manual initialization request in current conversation

## What happened
The repository did not contain an existing `/ccg` directory, no `graph/graph.json` file, and no `SKILL.md` files. The CCG system needed to be initialized from an empty state so that future skills, primitives, and references can be added and wired into a capability graph.

## Proposed change
Type: new-node

Since there are currently no skills, primitives, or references, this bootstrap only establishes the core CCG structure and an empty graph:

- Create the base directory structure:
  - `ccg/graph/`
  - `ccg/skills/`
  - `ccg/primitives/`
  - `ccg/references/`
  - `ccg/proposals/`
  - `ccg/logs/`
- Create an initial `graph.json`:
  - `version`: `1.0.0`
  - `last_updated`: `2026-03-17`
  - `nodes`: empty array
  - `edges`: empty array
- Add `.gitkeep` files in empty directories (`skills/`, `primitives/`, `references/`) so the structure can be tracked in version control.

At this stage no actual capability nodes are defined, so there is no concrete `SKILL.md` to propose. The first real skill that is added to the repository should come with its own proposal describing the new node, its edges, and any primitives or references it uses.

## Risk
The main risk is that committing an empty graph might give a false sense that the capability system is fully configured when it is still blank. There is no functional behavior tied to the graph yet, so the operational risk is low.

## Rollback
- Delete the `ccg/` directory (or selectively remove `graph/graph.json` and the empty subdirectories) from the repository.
- Remove or revert the corresponding commit in version control.
