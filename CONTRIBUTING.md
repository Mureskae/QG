# Contributing to QG

QG is a speculative protocol — a conceptual space, not a codebase. That means contribution here looks different from a typical open source project.
You don't need to write code.

## Before you start: what's authoritative

- `QG_Model_Spec.md` and the reference implementation (`qg_model.py`,
  `qgmath/`) are the source of truth for anything technical. If a claim
  elsewhere in the repo disagrees with those, the spec and code win —
  please open an issue rather than assuming the other document is right.
- `Manifesto.md`, `QG_ONE_LINER.md`, `Executive Summary` are the
  philosophy layer — motivating narrative, not held to the same
  falsifiability bar.
- Files under `/concepts` and the standalone research notes
  (`STRATEGY-PROOFNESS.md`, `J-SPACE-INTEGRATION.md`, etc.) are
  exploratory — expect gaps, and see each file's own "Open Questions"
  section before assuming something there is settled.

## Ways to contribute

### 💬 Discuss

Open an [Issue](https://github.com/Mureskae/QG/issues) to:

- Challenge an assumption in the protocol
- Propose a new concept or primitive
- Share a related project, paper, or idea
- Ask a question that the current docs don't answer

### ✍️ Write

Submit a Pull Request to:

- Add a concept file to `/concepts`
- Extend or refine existing protocol documents
- Translate a document into another language
- Fix unclear or ambiguous language anywhere

### 🔀 Fork & remix

Take QG in a different direction. Build something adjacent. We'd love to know about it — open an issue and share a link.

## Guidelines

- Be specific. Vague agreements ("cool idea") are less useful than specific tensions ("this contradicts X because...").
- Disagree openly. The protocol evolves through challenge, not consensus.
- Keep it grounded. Speculative is fine; unconnected to reality is not.
- If you're proposing a new formula or function, either give it a closed
  form or mark it explicitly as `(open)` — see `QG_Model_Spec.md` §5 for
  the convention this repo follows.
- No contribution is too small. A single sentence that sharpens a definition is valuable.

## First time here?

Look for issues tagged `good first issue` — these are specific, bounded questions where outside perspective is especially useful.

## Code of conduct

Treat other participants with respect. Critique ideas, not people.
