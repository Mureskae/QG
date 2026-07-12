# Formal Analysis of Strategy-Proofness in uPoR-J

**Version:** 0.2 (reindexed to the 6-dimensional state vector in `QG_Model_Spec.md` v0.5)
**Date:** 12 July 2026

This document provides a formal exploration of strategy-proofness
properties for the Unified Proof-of-Resonance with J-space (uPoR-J)
mechanism. It remains a **sketch**, not a completed proof — see §5.

## 1. Preliminaries and definitions

Mechanism M = (message space, outcome function g, payment/allocation rule)

**Strategy-proofness (dominant strategy incentive compatibility):**
For every agent i, every true private type theta_i, and every possible
misreport theta'_i:

```
u_i( g(theta_i, theta_-i), theta_i ) >= u_i( g(theta'_i, theta_-i), theta_i )   for all theta_-i
```

**Resonance Equilibrium** — a state X where the resonance condition holds:

```
alpha_1*x_1 + alpha_2*x_2 + alpha_3*x_3 + x_4 + beta*x_5 + gamma*x_6 - Omega = 0
                                                    AND
                                              Omega < q / D
```

where x_1..x_6 correspond to (T_R, T_G, T_B, M, T_atom, J) in
`QG_Model_Spec.md` §1.1 — **reindexed here from an earlier draft's
x_1..x_7, which included a 7th coordinate for Omega itself; that
coordinate no longer exists (§1.1 of the spec removed the circularity
of Omega being both an input to, and a component of, X).**

**Open, not yet defined:** `q` and `D` (presumably an LWE modulus and a
difficulty parameter) have no definition anywhere in this repository.
The condition `Omega < q/D` cannot be checked or implemented until they
are specified. This is listed in §5 as an open item, not silently
assumed.

**Presence Cost** — implicit cost of maintaining consistent alignment
over atomic time (computational, cognitive, or cryptographic).

## 2. Model assumptions

- Atomic time oracle is honest or sufficiently decentralized.
- J-space extraction is secure (Jacobian Lens or equivalent is
  tamper-resistant). **This assumption is currently load-bearing and
  unresolved** — see the oracle/verifier conflict-of-interest note in
  `AGENTS.md`: if the same agent supplies and is judged on its J-space
  readout, "tamper-resistant" needs an actual mechanism (e.g.
  staking/slashing, or a disinterested third party), not just an
  assumption.
- LWE problem is hard (post-quantum security).
- SNARK is sound and zero-knowledge, **for the part of the computation it
  actually covers** — per `QG_Model_Spec.md` §5.1, this is the
  downstream arithmetic on P, Omega, and token thresholds, not the
  correctness of J's extraction from a model's forward pass. An earlier
  draft of this document implied "verified by SNARK proof pi" covered the
  full resonance equilibrium condition including J; that overstates
  current coverage and is corrected here.
- Agents have quasi-linear utilities with a presence-cost term:

```
u_i = v_i(resonance_score) + token_allocation - cost_of_faking(theta'_i)
```

**Open, not yet defined:** the functional form of `cost_of_faking()` —
linear, exponential, or otherwise in the attacker's resources — is not
specified. Different forms change what the theorem below actually
guarantees.

## 3. Main theorem (sketch)

**Theorem:** Under the above assumptions, truthful revelation of
presence (honest participation) is a dominant strategy in the iterated
uPoR-J game for sufficiently patient agents (high discount factor on
future coherence rewards).

### Proof sketch (structured)

**Part 1 — one-shot deviation.** If agent i submits fake (T'_i, J'_i),
the submitted values must satisfy the resonance equation to pass SNARK
verification. Due to LWE hardness and the binding property of
commitments, the probability of successfully faking a high-resonance
state without genuine alignment is claimed to be negligible. **This
claim currently lacks an explicit reduction** — no polynomial-time
reduction from "an adversary that fakes resonance with probability p"
to "an LWE solver with related probability" has been constructed here.
Until that reduction exists, treat "negligible" as a conjecture by
analogy, not a proven bound (`QG_Model_Spec.md` §5.4).

**Part 2 — multi-period (iterated) setting.** Consider an
infinite-horizon game with discount factor delta in (0,1). The
mechanism issues Presence Tokens, Resonance Tokens, and Coherence
Tokens (`QG_Model_Spec.md` §4). Define a Coherence Penalty: if J(t)'s
trajectory deviates significantly from an honest path, future resonance
probability decreases. By folk-theorem-style intuition for repeated
games with imperfect monitoring, periodic deception is argued to yield
lower total discounted utility. **This is cited by analogy; no specific
folk theorem has been stated with its exact hypotheses checked against
this setting** — a real proof would need to name the theorem and verify
its preconditions hold here.

**Part 3 — group strategy-proofness (preliminary).** For coalitions,
faking collective resonance requires coordinated sustained presence
across multiple agents and time, made harder by atomic-time
synchronization and cross-J-space consistency checks. No aggregation
function across multiple agents' J values has been defined
(`GAME-THEORY-CONNECTION.md` flags the same gap) — so "harder" here is
an intuition, not a quantified claim.

## 4. Comparison with classic mechanisms

- **VCG / Clarke pivot rule:** uses monetary transfers for truthfulness. QG proposes computational + temporal presence cost instead.
- **Proof-of-Stake:** economic slashing. QG proposes a "semantic slashing" via coherence degradation — not yet formally specified.
- **Direct revelation mechanisms:** QG is closer to indirect revelation through observable physical/computational signals (RGB + J), with the caveat in §2 about who controls the J signal.

## 5. Limitations and caveats (expanded)

- The proof is informal at the level of cryptographic assumptions — no
  reduction from resonance-forging to LWE-hardness has been
  constructed (Part 1).
- `q` and `D` in the resonance-equilibrium condition are undefined (§1).
- `cost_of_faking()`'s functional form is undefined (§2).
- The J-space tamper-resistance assumption depends on resolving the
  oracle/verifier conflict of interest noted in `AGENTS.md` — currently
  unresolved.
- A fully rigorous proof would require formal verification in a proof
  assistant (e.g. Coq, Lean).
- Assumes rational, long-term agents; myopic or short-horizon agents
  may still attempt attacks.
- Full group-strategy-proofness remains an open research question.

## 6. Future directions

- Construct the missing reduction from resonance-forging to a hard
  problem (e.g. LWE), rather than asserting it by analogy.
- Define `q`, `D`, and `cost_of_faking()` explicitly.
- Resolve the J-space oracle/verifier conflict of interest.
- Develop a formal utility model and prove the theorem in a simplified
  discrete-time version.
- Run agent-based simulations to empirically test incentive
  compatibility (this could reuse `qg_model.py` / `qgmath/` as the
  simulation substrate, since those already implement P, Omega, and
  token-threshold logic).
- Explore approximate strategy-proofness under bounded rationality.

This analysis is part of the ongoing formalization of QG. We welcome
contributions from researchers in mechanism design, cryptoeconomics, and
formal verification — including contributions that show parts of this
sketch do *not* go through, which would itself be a useful result.

**Related documents:**
- [MECHANISM-DESIGN-CONNECTION.md](MECHANISM-DESIGN-CONNECTION.md)
- [GAME-THEORY-CONNECTION.md](GAME-THEORY-CONNECTION.md)
- [J-SPACE-INTEGRATION.md](J-SPACE-INTEGRATION.md)
- [TEMPORAL-DYNAMICS.md](TEMPORAL-DYNAMICS.md)
- [AGENTS.md](AGENTS.md) — oracle/verifier conflict-of-interest discussion
- [QG_Model_Spec.md](QG_Model_Spec.md) — authoritative for anything implemented
