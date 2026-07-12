# TIME_ENGINE_QG.md — Atomic Time in QG

## Why atomic time?

Unix timestamps are arbitrary (no physical anchor) and trivially
manipulable by anyone controlling the clock that produced them. QG uses
a physically defined clock instead: a count of caesium-133
hyperfine-transition periods, the same physical quantity that defines
the SI second (BIPM, since 1967).

## Two distinct quantities — do not conflate

An earlier draft used the symbol `T_atom` for two different things at
once: a smooth normalized value used inside the resonance function, and
a cryptographic hash used as a tamper-evident commitment. Hashing
deliberately destroys numerical closeness (two adjacent tick counts
produce unrelated hash outputs) — so using a hash where the resonance
function expects a smooth, comparable value silently breaks the
resonance calculation. This version names them separately:

### T_atom — smooth value (used inside Omega)

```
ticks(s) = round(s * 9_192_631_770)
T_atom   = (ticks mod W) / W
```

This is defined in full in `QG_Model_Spec.md` §2.1 and is the only
`T_atom` used in the presence/resonance/coherence formulas.

### C_atom — tamper-evidence commitment (a separate, optional primitive)

```
C_atom = H( ticks || salt )
```

where `H` is a standard cryptographic hash function and `salt` is a
per-session random value (renamed from an earlier draft's `R`, which
collided with the Merkle-root symbol `M` and the Resonance Token name —
see `QG_Model_Spec.md` §1 for the symbol table). `C_atom` is a
commitment: it lets a verifier later check that a claimed tick count
matches what was committed earlier, without exposing the tick count in
advance. It plays no role inside Omega — it is a separate anti-tampering
primitive, used at the protocol/consensus layer, not the math layer.

## Role in the protocol

- `T_atom` gives the resonance function a physically grounded, smooth
  time signal (see `QG_Model_Spec.md` §3.2).
- `C_atom` (optional, protocol-layer) helps prevent a party from
  claiming a different tick count after the fact, once combined with a
  commit-reveal scheme.
- Together they support coherence measurement over a rolling window
  (`QG_Model_Spec.md` §3.3) without depending on any single party's
  system clock.

## Known limitations (see `QG_Model_Spec.md` §2.1 for the authoritative version)

- This document does not perform TAI↔UTC leap-second conversion; a
  production system needs an authoritative leap-second table.
- `C_atom`'s security depends on the hash function and the commit-reveal
  scheme around it being implemented correctly — neither is specified
  here yet; that is an open item, not a solved one.

## Future directions (explicitly unresolved, not claims)

- Decentralized atomic-time oracles (removing reliance on a single
  timekeeping party).
- Relativistic corrections for geographically distributed systems.
- A continuous-phase representation instead of a discrete tick counter.

---

*Note: an earlier version of this document referenced an external
calendar-system example. That reference has been removed — this
document only depends on the SI-second definition of the Cs-133
hyperfine transition, not on any calendrical system, historical or
otherwise. See `QG_Model_Spec.md` §2.1 for the same scoping.*
