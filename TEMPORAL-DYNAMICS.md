# TEMPORAL-DYNAMICS.md — Temporal Dynamics of J-space in uPoR-J

*Note on formulas: plain text, not LaTeX — see `QG_Model_Spec.md` for why.*

## Named subdivisions of time — СМЖ (separate, optional module)

**Module boundary:** QG is a standalone protocol for measuring and
tokenizing an RGB attention stream (`QG_Model_Spec.md`). СМЖ is a
separate research effort — a named hierarchy of time subdivisions that
*can*, if desired, be used as one possible high-precision time source,
but is not a required part of QG at this stage. Nothing in
`QG_Model_Spec.md`'s formulas depends on СМЖ; `T_atom` there is defined
directly from the Cs-133 tick count (§2.1), independent of the naming
below.

Fixed integer ratios used by СМЖ:

```
Sutki (day)  = 16 Chas (hours)
Chas         = 144 Chasti
Chast        = 1296 Doli
Dolya        = 72 Mgnoveniy
Mgnovenie    = 760 Migov
Mig          = 160 Sigov
Sig          = 14000 Santigov
```

1 Sig is comparable to approximately 30 periods of the Cs-133
hyperfine-transition oscillation.

**Author's position (Mureskae/Dēnis), stated as a personal view, not a
technical claim:** the author holds that science, technology, and
natural cycles are a single, unbroken fabric of being, and that
returning to historically-rooted time divisions is part of restoring
that connection. This is recorded here as the author's philosophical
position, not as a claim this document makes about the SI second's
metrological definition — and it does not change any formula in
`QG_Model_Spec.md`.

## Evolution model *(open — not implemented)*

```
J(t + dt) = J(t) + delta(dT_atom) * f( Resonance(X_t), Input_t )
```

**Status: open.** `delta()`, `f()`, and `Input_t` are not defined
anywhere in this repository — see the same note in
`GAME-THEORY-CONNECTION.md`.

## Time-scale levels (qualitative)

- **Micro** (seconds) — momentary resonance
- **Meso** (minutes–hours) — session-level attention
- **Macro** (days–months) — formation of collective coherence

## Coherence condition (implemented and tested)

```
coherence_rate = max over consecutive samples of | (J[i+1] - J[i]) / (t[i+1] - t[i]) |
```

A trajectory is coherent over a window when `coherence_rate < epsilon`.
See `coherence_metric()` / `CoherenceMetric()` in `qg_model.py` /
`qgmath/qgmath.go` (`QG_Model_Spec.md` §3.3). `epsilon` is an
uncalibrated placeholder (§5.3).

## Significance

The protocol aims to distinguish surface-level from sustained
attention, rewarding the latter with a Coherence Token
(`QG_Model_Spec.md` §4). This is implemented today only through the
tested `coherence_rate` mechanism above.

**Related documents:**
- [QG_Model_Spec.md](QG_Model_Spec.md) §2.1, §3.3 — authoritative
- [Manifesto.md](Manifesto.md) — philosophy layer
- [J-SPACE-INTEGRATION.md](J-SPACE-INTEGRATION.md)
- [GAME-THEORY-CONNECTION.md](GAME-THEORY-CONNECTION.md)
