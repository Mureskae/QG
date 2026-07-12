# J-Space Integration in Unified Proof-of-Resonance (uPoR-J)

**Version:** 0.3 (aligned with `QG_Model_Spec.md` v0.5)
**Date:** 12 July 2026
**Author:** Mureskae (Dēnis)
**Tags:** #QGprotocol #JSpace #AttentionEconomy

*Note on formulas: plain text, not LaTeX — see `QG_Model_Spec.md` for
why (`$...$` rendering is inconsistent across GitHub web/app/mobile).*

## Introduction

This document describes the integration of J-space (Jacobian Lens /
sparse global workspace, Anthropic 2026) into the Unified
Proof-of-Resonance protocol. J-space is a sparse, partially
interpretable "workspace" inside an LLM. **Explicit non-claim:** the
underlying research characterizes this as an interpretability finding
about internal representations — it does not characterize it as
detecting consciousness, verbalized awareness, or subjective experience,
and this document makes no such claim. (This corrects language in an
earlier draft of this file; see the same non-claim in
`QG_Model_Spec.md` §2.3.)

The phrase "digital alchemy," used elsewhere in this repository's
philosophy layer (see `Manifesto.md`), is a metaphor about turning a
raw signal into a meaningful one — it is not a technical claim and does
not appear in the formal definitions below.

## Architecture — aligned with the 6-dimensional state vector

**Superseded:** an earlier draft of this document used a 7-dimensional
vector that included Omega as a coordinate of itself — a circular
definition. The current, authoritative definition is in
`QG_Model_Spec.md` §1.1:

```
X = [T_R, T_G, T_B, M, T_atom, J]   (6-dimensional)
```

Omega is computed from X, not stored inside it (`QG_Model_Spec.md`
§3.2).

Components (see `QG_Model_Spec.md` §1–2 for full definitions):

- `T_R, T_G, T_B` — normalized RGB channels (not "LWE tokens" — see
  the correction below)
- `M` — Merkle root of aggregated data, renamed from an earlier
  draft's `R`, which collided with the Merkle-root symbol and the
  Resonance Token name (`QG_Model_Spec.md` §1)
- `T_atom` — Cs-133 tick count, normalized (§2.1) — not Unix time
- `J` — J-space projection (§2.3, aggregation function `g()` still open)

**Correction on "LWE tokens":** an earlier draft described `T_1, T_2,
T_3` as "post-quantum LWE tokens." They are, in the current spec, plain
normalized RGB channel values (§1, §2). If post-quantum commitments are
wanted on top of these values, that is a separate cryptographic layer
not yet specified — the channels themselves are not LWE samples.

## Resonance function

See `QG_Model_Spec.md` §3.2 for the authoritative definition (a
sigmoid of a *centered and gain-scaled* weighted sum — the centering and
gain are load-bearing, not cosmetic; see that section for why an
earlier uncentered version collapsed into a narrow, non-discriminating
band). This document no longer restates a separate, divergent version
of the formula, to avoid the drift that happened here previously.

## SNARK coverage — corrected

**An earlier draft of this document claimed the SNARK proof "covers all
components, including the correctness of the J-projection." This is
incorrect and is retracted here.** Producing a zero-knowledge proof
that a claimed J value came from a genuine, correct J-lens readout over
a specific model's forward pass would require proving LLM inference
inside a SNARK circuit — not achievable at practical scale with current
cryptography (`QG_Model_Spec.md` §5.1). What is actually SNARK-verifiable
today is the downstream arithmetic on P, Omega, and the token-issuance
thresholds (§3–4). J itself is supplied by a trusted oracle under an
explicit centralization trade-off, not a decentralized proof.

## RGB-J measurement layer

A RGB capture serves as a physical anchor:

1. Capture RGB (or a hash/statistic of it).
2. Feed it to the model.
3. Extract a J-snapshot.
4. Form a composite record: `merkle_root || T_atom || J`.

This links a depersonalized physical signal (light) to a
partially-interpretable model-internal signal (J) — see the explicit
non-claim in `QG_Model_Spec.md` §1 about what this does and does not
imply about a person's emotional or cognitive state.

## Benefits of the integration (proposed, not all implemented)

- Makes the protocol sensitive to a model's internal "attention" state,
  as approximated by J-lens.
- Opens new resonance types (human-AI) — see the aggregation gap noted
  in `AGENTS.md` and `GAME-THEORY-CONNECTION.md`.
- Intended to increase tamper-resistance — partially achieved: the
  arithmetic layer is SNARK-verified, the J-readout layer currently is
  not (see SNARK coverage section above).
- Connects a depersonalized attention signal to recent AI
  interpretability research — stated as a connection, not as a proof
  that either domain validates the other.

## Next steps

- Prototype implementation — see `qg_model.py` / `qgmath/` for the
  parts of this that are already implemented and tested (P, Omega,
  coherence, token thresholds). J's aggregation function `g()` and the
  oracle/commit-reveal scheme for J are not yet implemented.
- Full economic model (see `TOKENOMICS.md`, itself still an early draft).
- Tests on real models, once `g()` is defined (§5.2 in the spec).
