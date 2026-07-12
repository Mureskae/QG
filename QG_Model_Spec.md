# QG Model Specification (uPoR — unified Proof-of-Resonance)

**Version:** 0.4 (consolidated)
**Status:** Working draft. Sections marked *(open)* are unresolved research
problems, not implemented results. A reference implementation accompanies
this spec (`qg_model.py`, `qgmath/`) and is the source of truth in any
case of disagreement between prose and code.

*Note on notation: formulas below are written in plain monospace text,
not LaTeX math markup. GitHub's math rendering (`$...$`) is inconsistent
between the web UI, the mobile app, and Preview panes — plain code blocks
render identically everywhere.*

---

## Abstract

This document specifies a state representation and a set of derived
functions — *presence*, *resonance*, and *coherence* — intended to convert
a stream of attention-related measurements into verifiable, quantized
events. It supersedes earlier informal drafts that used undefined
functions (`H()`, `δ()`, `f()`), an internally circular definition of
resonance, and a dimensionally inconsistent gradient operator on a scalar
time series. Every quantity below is either (a) fully defined in closed
form, (b) implemented and unit-tested in the accompanying reference code,
or (c) explicitly labeled *(open)* and excluded from any claim of
completeness.

---

## 1. Notation and primitive quantities

| Symbol | Domain | Description |
|---|---|---|
| `T_R, T_G, T_B` | [0, 1] | Normalized RGB channel intensities: `T_c = raw_c / 65535` for a 16-bit capture |
| `M` | [0, 1) | A session's Merkle root, mapped to the unit interval (§2.2) |
| `T_atom` | [0, 1) | Physical time, represented as a rolling-window-normalized count of Cs-133 hyperfine-transition periods (§2.1) |
| `J` | [0, 1) approx. | A scalar aggregate of a J-lens interpretability snapshot (§2.3) — **the aggregation function is not finalized; see §5.2** |

No symbol above is reused for anything else in this document. (Earlier
drafts used `R` simultaneously for a state coordinate, a Merkle root, and
a token name; that collision is retired here — the token is named
**Resonance Token (RT)**, never `R`.)

**Explicit non-claim about emotional or cognitive content.** `T_R`,
`T_G`, `T_B` are raw normalized light-intensity channels from a 16-bit
capture — nothing more. Earlier drafts and public-facing text described
them as "emotional energy," "cognitive energy," and "intuitive energy."
That framing is retired here and should not appear in any technical
document derived from this spec. QG makes no claim to infer a person's
emotions, thoughts, or identity from a color signal. The claim is
narrower and defensible: color is a universal, depersonalized physical
signal from which an interaction metric can be constructed — not a
window into a person's internal state. Any document (Executive Summary,
public writeups) that still uses the emotion/cognition/intuition framing
should be revised to match this.

### 1.1 State vector

```
X = [T_R, T_G, T_B, M, T_atom, J]   (6-dimensional, each component in [0,1))
```

Six dimensions, not seven. Ω (resonance) is **not** a coordinate of X: it
is a function of X, verified on demand, not stored as a free variable.
(An earlier draft placed Ω inside the vector it was also computed from —
a circular definition. This version removes that circularity entirely.)

---

## 2. Primitive quantity definitions

### 2.1 Physical time — T_atom

The SI second is defined as exactly **9,192,631,770** periods of the
radiation corresponding to the hyperfine transition of the ground state
of caesium-133 (Cs-133; BIPM, since 1967). This is not a design choice —
it is the international definition of the second.

```
ticks(s)  = round(s * 9_192_631_770)
T_atom    = (ticks mod W) / W        where W = ticks(window_seconds)
```

for a chosen rolling window `W` (e.g. one hour). The tick count is
represented in base 16 for storage/display; this is purely a numeral-base
choice and carries no further significance.

*Caveat:* this specification does not perform TAI↔UTC leap-second
conversion. A production implementation requires an authoritative
leap-second table (e.g. IERS Bulletin C) to convert real-world
timestamps into TAI seconds before ticking. See `SecondsToCs133Ticks()` /
`seconds_to_cs133_ticks()` in the reference implementation for the exact
boundary of what is and isn't handled.

*Relationship to `TIME_ENGINE_QG.md`:* that document additionally
describes an optional tamper-evidence commitment, `C_atom = H(ticks ||
salt)`. This is a separate quantity from `T_atom` above — a hash
destroys numerical closeness by design, so `C_atom` cannot be substituted
for `T_atom` inside the resonance function in §3.2. `C_atom` is a
protocol/consensus-layer primitive, not a term in any formula in this
document.

### 2.2 Merkle root — M

`M` is the Merkle root of a session's aggregated capture data, mapped to
[0, 1) by:

```
M = min( (int(root_hex) mod 2^256) / 2^256,  1 - 2^-53 )
```

The clamp at `1 - 2^-53` exists because IEEE-754 double-precision floats
carry only 53 bits of mantissa; without it, the maximal 256-bit root value
rounds exactly to 1.0 and silently violates the stated [0,1) contract.
(This was found by property-testing the reference implementation, not by
inspection — see `test_merkle_root_in_unit_interval`.)

### 2.3 J-lens snapshot — J *(partially open)*

`J` is intended to be a scalar summary of a J-lens reading (Anthropic,
2026) — a sparse, partially interpretable projection of a language
model's internal activations at a fixed layer, for a fixed, versioned
model checkpoint.

```
J = g(raw_j_lens_activations)
```

**Open problem:** `g()` is not finalized. The reference implementation
uses a placeholder (L2 norm followed by tanh squashing) explicitly
marked as such — it has not been justified as the correct aggregation and
should not be treated as a settled design choice.

**Explicit non-claim:** J-lens is an interpretability tool over model
internals; the underlying research does not characterize it as detecting
consciousness or subjective experience, and this specification makes no
such claim. Any language suggesting otherwise belongs in a philosophy/
manifesto document, not here.

**Known limitation:** producing a zero-knowledge proof of J's
correctness would require proving a full language-model forward pass
inside a SNARK circuit. This is not a solved problem in zkML at any
practical model scale as of this writing. §5.1 records the current
mitigation (trusted-oracle commit-reveal) as an explicitly interim,
non-final architecture.

---

## 3. Derived quantities

### 3.1 Presence

```
P = w_R * T_R + w_G * T_G + w_B * T_B      where w_R + w_G + w_B = 1
```

Default: `w_R = w_G = w_B = 1/3` (uncalibrated placeholder).

### 3.2 Resonance

```
centered = alpha*(T_R - 0.5) + beta*(T_G - 0.5) + gamma*(T_B - 0.5)
         + delta*(M - 0.5)   + epsilon*(T_atom - 0.5) + zeta*(J - 0.5)

Omega = H( k * centered )     where H(x) = 1 / (1 + e^-x)   (logistic sigmoid)
```

`k` is a gain constant.

**Why the centering and gain terms are load-bearing, not cosmetic:** an
earlier draft omitted both — `Omega = H(alpha*T_R + ... + zeta*J)` with
non-negative terms summing to at most 1. Empirically (see the
session-simulation script in the reference implementation), this
collapses Omega into a narrow band (~0.57–0.65) regardless of the actual
input, because a weighted sum of several bounded non-negative terms
concentrates near its mean. Centering each term at zero and applying an
explicit gain `k` restores real dynamic range — verified by
`test_omega_has_real_dynamic_range` / `TestOmegaHasRealDynamicRange` in
both the Python and Go reference implementations. `k = 8.0` is itself an
unvalidated placeholder pending calibration against real data.

### 3.3 Coherence

Given a time-ordered sequence of `(t_i, J_i)` samples (seconds, scalar):

```
coherence_rate = max over i of | (J[i+1] - J[i]) / (t[i+1] - t[i]) |
```

A finite-difference time derivative, not a spatial gradient operator. An
earlier draft used a gradient symbol (∇J) on what is actually a scalar
sequence indexed by time — a type error, since a gradient is defined for
functions of several variables, not a time series. This version replaces
it with the correct construct.

---

## 4. Token issuance conditions

| Token | Condition | Notes |
|---|---|---|
| Presence Token (PT) | `P > theta_P` | `theta_P = 0.5`, uncalibrated |
| Resonance Token (RT) | `Omega > theta_Omega` | `theta_Omega = 0.5`, uncalibrated |
| Coherence Token (CT) | `coherence_rate < epsilon` over a rolling window | `epsilon = 0.05`, uncalibrated |

All thresholds are placeholders pending calibration against a labeled
dataset. No claim is made that these specific values are meaningful in
production.

---

## 5. Open problems (explicit, not hidden in prose)

### 5.1 SNARK coverage does not extend to J's computation

Verifying P, Omega, and the threshold comparisons in §4 in zero-knowledge
is a modest circuit (arithmetic over fixed-point values). Verifying that
a claimed J value came from a genuine, correct J-lens readout over a
specific model's forward pass is not — that would require proving LLM
inference inside a SNARK, which is not achievable at practical scale
today. **Interim mitigation:** J is supplied by a trusted oracle (a
designated model operator, with a public commit-reveal), and only the
downstream arithmetic on J is SNARK-verified. This is a centralization
trade-off, stated plainly, not a decentralized design.

### 5.2 g() — the J-lens aggregation function — is unresolved

See §2.3. Any specific functional form used before this is resolved
should be treated as a placeholder.

### 5.3 Weight and threshold calibration

`alpha, beta, gamma, delta, epsilon, zeta, k, w_R, w_G, w_B, theta_P,
theta_Omega, epsilon` (coherence threshold) are all currently
equal-weight or round-number placeholders. None have been fit to real
behavioral or interaction data. Treat any numeric claim derived from
current defaults as illustrative only.

### 5.4 Strategy-proofness

A proof sketch exists (see `STRATEGY-PROOFNESS.md`) arguing informally
that faking a high-resonance state without genuine engagement is
computationally hard, by analogy to LWE hardness. This is **not** a
formal reduction — no explicit polynomial-time reduction from a
resonance-forging adversary to an LWE solver has been constructed. Treat
this as a research direction, not a proven guarantee.

---

## 6. Reference implementation

- `qg_model.py` / `test_qg_model.py` — Python reference implementation
  and unit tests (20/20 passing at time of writing).
- `qgmath/qgmath.go` / `qgmath/qgmath_test.go` — dependency-free Go port
  of the same core math (12/12 tests passing), intended to be embedded in
  a Cosmos SDK module keeper.

Any formula in this document that disagrees with the reference
implementation should be considered an error in this document; the code
is authoritative.

---

## 7. Relationship to other documents in this repository

- `Manifesto.md`, `QG_ONE_LINER.md`, `Executive Summary` — philosophy
  layer. Motivating narrative, not falsifiable, not held to the bar in
  this document.
- `J-SPACE-INTEGRATION.md`, `TEMPORAL-DYNAMICS.md`,
  `LAGRANGIAN-FORMULATION.md`, `GAME-THEORY-CONNECTION.md`,
  `MECHANISM-DESIGN-CONNECTION.md`, `STRATEGY-PROOFNESS.md`,
  `TOKENOMICS.md` — exploratory research notes. Each contains a mix of
  legitimate terminology and unresolved gaps; none should be read as a
  completed result unless it is reflected in this document and the
  reference implementation.
