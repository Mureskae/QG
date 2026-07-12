# TEMPORAL-DYNAMICS.md — Temporal Dynamics of J-space in uPoR-J

*Note on formulas: plain text, not LaTeX — see `QG_Model_Spec.md` for why.*

## Evolution model *(open — not implemented)*

```
J(t + dt) = J(t) + delta(dT_atom) * f( Resonance(X_t), Input_t )
```

**Status: open.** `delta()`, `f()`, and `Input_t` are not defined
anywhere in this repository. This equation describes how J might
generate its own next value over time — it is a distinct, unimplemented
proposal from the tested coherence mechanism below. Do not conflate the
two (an earlier draft of `GAME-THEORY-CONNECTION.md` made this same
conflation; both documents now flag it consistently).

## Time-scale levels (qualitative, not yet tied to the equations above)

- **Micro** (seconds) — momentary resonance
- **Meso** (minutes–hours) — session-level attention
- **Macro** (days–months) — formation of collective coherence

**Note:** none of these scales appear as a parameter in the evolution
equation above or in the coherence condition below — there is currently
no explicit mechanism by which "micro," "meso," and "macro" behavior
differ mathematically. Treat these as descriptive labels for future
work, not as implemented distinctions.

## Coherence condition — corrected

**An earlier draft of this document used a gradient operator (nabla-J)
on what is actually a scalar time series, and mixed a continuous
integral with the discrete recurrence above — both are corrected here.**
J is a scalar (`QG_Model_Spec.md` §1, §2.3), indexed at discrete atomic-time
samples, not a field over multiple spatial variables — a gradient
operator does not apply to it. The correct construct is a time
derivative (or, for discrete samples, a finite difference):

```
coherence_rate = max over consecutive samples of | (J[i+1] - J[i]) / (t[i+1] - t[i]) |
```

A trajectory is considered coherent over a window when:

```
coherence_rate < epsilon
```

**This version is implemented and tested** — see `coherence_metric()` /
`CoherenceMetric()` in `qg_model.py` / `qgmath/qgmath.go`
(`QG_Model_Spec.md` §3.3). `epsilon` is a threshold with a placeholder
default (0.05) pending calibration (§5.3) — it has units of J per
second, and no claim is made that 0.05 is meaningful before
calibration against real data.

## Significance

The protocol aims to distinguish surface-level from sustained attention,
rewarding the latter with a Coherence Token (`QG_Model_Spec.md` §4).
This distinction is implemented today only through the tested
`coherence_rate` mechanism above — the richer micro/meso/macro
distinction and the J(t) self-evolution equation remain open research
directions, not implemented behavior.

**Related documents:**
- [QG_Model_Spec.md](QG_Model_Spec.md) §3.3 — authoritative, tested coherence definition
- [J-SPACE-INTEGRATION.md](J-SPACE-INTEGRATION.md)
- [GAME-THEORY-CONNECTION.md](GAME-THEORY-CONNECTION.md) — same J(t) evolution gap flagged
- [STRATEGY-PROOFNESS.md](STRATEGY-PROOFNESS.md)
