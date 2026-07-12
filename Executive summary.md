# Executive Summary — Quantum Gratitude (QG)

## The problem

Digital platforms optimize for engagement, treating human attention as a
resource to be captured and monetized. This is a well-documented dynamic
in attention-economy research and has known negative externalities:
fragmented focus, addictive design patterns, and platforms whose
incentives run counter to user wellbeing.

## The idea

QG explores a different foundation: instead of treating attention as a
resource to extract, measure engagement through a depersonalized physical
signal — light/color intensity from a digital capture — and build a
value-issuance mechanism (Presence, Resonance, Coherence tokens; see
`QG_Model_Spec.md`) on top of it.

**What QG measures:** raw RGB channel intensity from a 16-bit capture,
plus a physically-defined time signal (Cs-133 tick count) and a
still-experimental interpretability signal (J, see `QG_Model_Spec.md`
§2.3, currently unresolved).

**What QG explicitly does not claim:** it does not infer emotions,
thoughts, identity, or any other personal attribute from this signal. See
`QG_Model_Spec.md` §1 for the explicit non-claim. Earlier drafts of this
document described the RGB channels as "emotional energy," "cognitive
energy," and "intuitive energy" — that framing has been retired as
unsupported and is not used anywhere in the current spec or reference
implementation.

## Status

This is a research prototype, not a financial product. No token has been
issued. The reference implementation (`qg_model.py`, `qgmath/`) is
tested, but every threshold and weight in it is an explicit,
unvalidated placeholder pending calibration against real data (see
`QG_Model_Spec.md` §5.3).

Several components required for the full design as originally envisioned
are open research problems, not solved engineering — most notably,
verifying the interpretability signal (J) inside a zero-knowledge proof
would require proving a full language-model inference inside a SNARK
circuit, which is not achievable at practical scale with current
cryptography (`QG_Model_Spec.md` §5.1).

## What this is not

- Not a claim to read emotional or cognitive state from color data.
- Not an investment product, basic-income scheme, or financial
  instrument. If a token or exchange mechanism is built on top of this
  research in the future, that will require its own legal review
  (securities and AML considerations vary by jurisdiction) — this
  document makes no claims about that and is not a substitute for legal
  or financial advice.
- Not a claim of historical or cosmological grounding. The technical
  design (state vector, resonance function, token conditions) stands on
  its own; it does not rely on, and should not be described as validated
  by, any historical or esoteric calendar system.

## Where to look next

- `QG_Model_Spec.md` — the authoritative technical specification.
- `Manifesto.md` — the motivating narrative (philosophy layer, not held
  to the same falsifiability bar as the spec).
- `qg_model.py` / `qgmath/` — tested reference implementation.
