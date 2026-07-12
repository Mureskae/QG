# QG: Attention Measurement Model through RGB Channels

*Note on formulas: plain text, not LaTeX — see `QG_Model_Spec.md` for why.*

## Introduction

QG (Quantum Gratitude) measures a person's presence and interaction in
digital space using three raw signal channels (R, G, B). It is based on
measurable quantities available with current technology.

## Main idea

QG digitizes RGB channel intensity from a capture and uses it as a
depersonalized attention-adjacent signal (see `QG_Model_Spec.md` §3.1
for the tested Presence function built from these same channels).

## Interpretation of RGB channels — corrected

**An earlier draft of this document labeled the channels "emotional
energy," "cognitive energy," and "intuitive energy." That framing is
retired.** Per the explicit non-claim in `QG_Model_Spec.md` §1: these
are raw, normalized light-intensity channels — nothing more. QG makes
no claim to infer emotion, cognition, or any other internal state from
color data.

| Channel | Technical measurement | Role in QG |
|---|---|---|
| R (Red) | Intensity, 0–65535 | One of three inputs to Presence (`QG_Model_Spec.md` §3.1) and Resonance (§3.2) |
| G (Green) | Intensity, 0–65535 | Same |
| B (Blue) | Intensity, 0–65535 | Same |

## Mathematical model

**Relationship to `QG_Model_Spec.md`:** the spec's Presence function
(§3.1) uses *normalized* channels `T_R = R/65535` etc. with weights
summing to 1. The model below is a related but distinct proposal — an
*accumulated* score over a time period, using unnormalized raw values
and independently-chosen weights. Both should be reconciled before
being treated as the same quantity; for now, treat this as a candidate
extension, not an implemented part of the spec.

Parameters:

- `(R_t, G_t, B_t)` — channel values at time t (0…65535)
- `(w_r, w_g, w_b)` — channel weight coefficients (example: w_r=1.2, w_g=1.0, w_b=0.8 — illustrative, not calibrated, and unlike `QG_Model_Spec.md` §3.1 these are not constrained to sum to 1)
- `C_h` — attention-flow coherence index (0…1) — **see correction below**
- `k` — energy-to-token conversion coefficient (uncalibrated placeholder)
- `T` — measurement period

Attention signal at time t:

```
E_t = w_r * R_t + w_g * G_t + w_b * B_t
```

Accumulated score over period T:

```
Accumulated_score = ( sum over t=0..T of E_t ) * C_h * k
```

### C_h — defined in terms of the tested coherence_rate, not left open

An earlier draft left `C_h` as an undefined "coherence index." This
version defines it concretely in terms of the already-implemented and
tested `coherence_rate` (`QG_Model_Spec.md` §3.3):

```
C_h = exp( -coherence_rate / epsilon )
```

clipped to [0, 1]. This maps a low, stable `coherence_rate` (coherent
attention) to `C_h` near 1, and a high, erratic rate to `C_h` near 0 —
consistent with `coherence_rate < epsilon` being the tested condition
for minting a Coherence Token (§4). This specific mapping (the
exponential form) is itself a proposal, not yet validated against real
data — treat it as a starting point for calibration, not a finished
result.

### Naming conflict — "QG token" vs. PT/RT/CT

**An earlier draft called the accumulated score a "QG token,"
independent of the Presence/Resonance/Coherence tokens defined in
`QG_Model_Spec.md` §4.** That is a fourth, unreconciled token type. Until
this is resolved, do not treat "QG token" as a fourth issued asset —
either (a) this accumulated score should be renamed to something
distinct from "token" (e.g. an "Attention Accumulation Score," an
off-chain metric feeding into PT/RT/CT issuance decisions), or (b) it
should be shown to be equivalent to some combination of the existing
three tokens. Neither has been done yet; this is an open reconciliation
item, not a solved design.

## Model value (as proposed, pending the reconciliation above)

- Configurable channel weights could adapt the model to different
  contexts (social platforms, educational tools, meditation practices) —
  untested.
- The coherence factor aims to reward quality of attention, not just
  quantity — now tied to a concrete, tested formula (above), rather than
  left as an undefined index.
- 16-bit channel depth gives fine-grained input resolution; this by
  itself does not imply "ultra-precise measurement" of anything beyond
  the raw light signal — no claim is made about precision of any
  inferred internal state, per the non-claim in `QG_Model_Spec.md` §1.

## Conclusion

This document proposes an accumulated-score extension on top of the RGB
channels already defined and tested in `QG_Model_Spec.md`. Before this
is treated as part of the core protocol, it needs: (1) reconciliation
with the existing three-token model, (2) calibration of `w_r, w_g, w_b,
k`, and the `C_h` formula against real data, and (3) removal of any
remaining emotion/cognition framing from derivative documents (e.g. an
earlier Medium draft used the same retired language — see
`Executive Summary`'s non-claim section for the corrected framing to
copy from).

**Related documents:**
- [QG_Model_Spec.md](QG_Model_Spec.md) — authoritative Presence/Resonance/Coherence definitions
- [TOKENOMICS.md](TOKENOMICS.md) — existing PT/RT/CT token definitions, needs reconciliation with this document
