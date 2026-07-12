# QG — Quantum Gratitude Protocol

A speculative protocol exploring attention, resonance and presence as value primitives.

QG is not a product.
It is a conceptual system design space, split into two layers:

- **Philosophy layer** — manifesto, motivating narrative. Not falsifiable, not meant to be.
- **Spec layer** — formal definitions, computable functions, tested reference implementation. Meant to be falsifiable and checkable against code.

## Repository map

| Layer | File | Purpose |
|---|---|---|
| Philosophy | `Manifesto.md` | Motivating narrative, why this design space matters |
| Philosophy | `QG_ONE_LINER.md` | One-sentence framing |
| Philosophy | `Executive Summary` | Non-technical overview |
| **Spec (authoritative)** | `QG_Model_Spec.md` | Formal model: state vector, presence/resonance/coherence functions, explicit open problems |
| Reference code | `qg_model.py`, `test_qg_model.py` | Python implementation, 20/20 tests passing |
| Reference code | `qgmath/qgmath.go`, `qgmath/qgmath_test.go` | Dependency-free Go port, 12/12 tests passing, built for embedding in a Cosmos SDK module |
| Research notes | `J-SPACE-INTEGRATION.md`, `TEMPORAL-DYNAMICS.md`, `LAGRANGIAN-FORMULATION.md`, `GAME-THEORY-CONNECTION.md`, `MECHANISM-DESIGN-CONNECTION.md`, `STRATEGY-PROOFNESS.md`, `TOKENOMICS.md` | Exploratory. Each mixes legitimate terminology with unresolved gaps — see each file's own "open questions" section. Not completed results unless reflected in `QG_Model_Spec.md`. |
| Meta | `AGENTS.md`, `agents.json` | Agent-facing instructions/config |
| Meta | `CONTRIBUTING.md` | How to contribute |

## Core idea

We move from:
- attention as traffic
to
- attention as presence

and further into:
- resonance as a coordination mechanism

## Domains

- attention economy
- symbolic protocol design
- experimental system architecture
- human–AI interaction models

## Key concepts

- Presence — a weighted function of raw, depersonalized light-intensity channels (see `QG_Model_Spec.md` §3.1). **Not** an emotional or psychological measurement — see the explicit non-claim in §1.
- Attention
- Resonance (PoR) — see `QG_Model_Spec.md` §3.2
- Coherence — see `QG_Model_Spec.md` §3.3

## Status

Early-stage speculative framework. Philosophy layer is stable. Spec layer
(`QG_Model_Spec.md`) is the authoritative technical document — every
formula in it is either implemented and tested, or explicitly marked
*(open)*. Where any other file in this repository disagrees with
`QG_Model_Spec.md` or the reference code, the spec and code win.

Not production software. Not audited. No token has been issued.

## Note

This repository is part manifesto, part conceptual architecture, part
experimental design space, part tested reference code. The Spec and
reference-code rows above are held to a stricter bar than the philosophy
and research-notes rows: every term must be defined and either
implemented or explicitly flagged as unresolved.

