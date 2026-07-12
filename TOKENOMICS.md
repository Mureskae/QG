# TOKENOMICS.md — uPoR-J (three tokens)

**Status:** early draft. Every open item below is flagged explicitly
rather than left implicit — this document previously stated things in
prose that turned out to be either undefined or in conflict with other
files; those are corrected here.

## Presence Token (PT)

- Minted when `P > theta_P` (`QG_Model_Spec.md` §3.1, §4). `theta_P =
  0.5` is an uncalibrated placeholder.
- Intended profile: high volume, low unit value. **No supply cap,
  emission curve, or numeric target has been specified** — "high
  volume, low value" is a design intention, not a defined parameter set.

## Resonance Token (RT)

- Minted when `Omega > theta_Omega` (§3.2, §4). `theta_Omega = 0.5` is
  an uncalibrated placeholder, chosen specifically because the naive
  (uncentered, ungained) version of Omega made *any* threshold
  degenerate — see §3.2's note on why centering and gain were required.
- Renamed from an earlier draft's "Resonance Token (R)" — `R` collided
  with the Merkle-root symbol and is retired everywhere in this
  repository (`QG_Model_Spec.md` §1).
- Intended profile: medium scarcity. **No numeric scarcity target
  (emission rate relative to PT) has been specified.**

## Coherence Token (CT)

- Minted when `coherence_rate < epsilon` over a rolling window (§3.3,
  §4). `epsilon = 0.05` is an uncalibrated placeholder.
- Intended profile: highest scarcity, plus governance rights. **Neither
  is defined:** no scarcity target is given, and "governance rights"
  does not specify what decisions are governed, what voting rule is
  used (one-token-one-vote? quadratic? something else?), or how
  double-counting/vote-buying is prevented.

## Open items (previously implicit, now explicit)

- **Total emission:** "fixed" was stated without specifying whether
  that means one fixed total across all three tokens combined, or three
  independently fixed caps. Undefined — needs a decision before any
  implementation.
- **Distribution mechanism — SNARK coverage corrected.** An earlier
  draft stated distribution happens "exclusively through uPoR-J SNARK
  proofs." Per `QG_Model_Spec.md` §5.1, SNARK verification today covers
  the arithmetic on P, Omega, and the threshold comparisons — it does
  not cover the correctness of J's extraction from a model's forward
  pass, which is supplied by a trusted oracle under an explicit
  centralization trade-off. Token issuance inherits that same
  limitation; it is not "exclusively" SNARK-verified end-to-end today.
- **Anti-Sybil mechanism:** not specified. Nothing here currently
  prevents an actor from running many low-cost identities, each
  honestly clearing the Presence threshold, to farm PT at volume. "High
  volume, low value" is not itself an anti-Sybil mechanism.
- **Relationship to the accumulated-score proposal in
  `QG_RGB_attention_model_en.md`:** that document proposes a fourth,
  unreconciled "QG token" concept. Until reconciled, this document
  (PT/RT/CT) remains the only defined token model — the accumulated
  score there should not be treated as a fourth issued asset.
- **Conversion rates between PT, RT, and CT:** not specified.

## Goal

Value is intended to derive from measured presence and resonance rather
than from speculation. This is a design intention; none of the
mechanisms above are complete enough yet to make that intention
enforceable — see the open items above for what remains.

**Related documents:**
- [QG_Model_Spec.md](QG_Model_Spec.md) §3–4 — authoritative, tested threshold definitions
- [QG_RGB_attention_model_en.md](QG_RGB_attention_model_en.md) — unreconciled fourth-token proposal
- [STRATEGY-PROOFNESS.md](STRATEGY-PROOFNESS.md) — incentive-compatibility analysis (sketch, not proof)
