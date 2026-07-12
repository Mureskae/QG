# Connection to Game Theory

QG reframes coordination problems by shifting from classical game-theoretic assumptions toward **resonance-based alignment**. This document is a research note: it proposes analogies and open questions, not proven results. Where a term below is compared to an established game-theory concept, that comparison is a hypothesis to be checked, not a claim of equivalence — see "Open Research Questions" and the annotations below.

*Note on formulas: written as plain text, not LaTeX. GitHub's math rendering (`$...$`) is inconsistent across web/app/mobile — see `QG_Model_Spec.md` for the same convention.*

## Classical game theory vs. QG framework (proposed analogy, not proven)

| Aspect                      | Classical / Traditional Game Theory                  | QG Resonance Framework (proposed)                    |
|-----------------------------|--------------------------------------------------------|-----------------------------------------------------|
| Agent model                 | Perfectly rational, utility maximizers                | Agents with presence, attention, and alignment capacity |
| Primary solution concept    | Nash equilibrium, Subgame perfect equilibrium          | "Resonance equilibrium" (proposed; not shown to be a subset, superset, or refinement of Nash equilibrium — open question) |
| Payoff structure            | Often zero-sum or fixed-sum                            | Non-zero-sum, emergent from shared presence          |
| Coordination mechanism      | Enforcement, contracts, reputation, staking            | Verifiable Proof-of-Resonance (see `QG_Model_Spec.md` §3–4; SNARK coverage is partial — §5.1) |
| Time model                  | Discrete rounds or infinite discounting                | Physically-defined time via Cs-133 ticks (`QG_Model_Spec.md` §2.1); the temporal-dynamics equation below is still open, not implemented |
| Information                 | Complete / incomplete information                      | J-space snapshots aim to reduce type-asymmetry (§2.3) — see the unresolved oracle/verifier conflict noted in `AGENTS.md` |
| Value creation               | Competitive advantage or cooperative bargaining        | Emergent coherence through iterated resonance (proposed) |

## Core theoretical directions (proposed, not established)

### 1. Resonance as an equilibrium concept — undefined relationship to Nash equilibrium

In classical theory, a Nash equilibrium is a state where no player
benefits from unilateral deviation. This document proposes "Resonance
Equilibrium" — a state of measurable mutual alignment across the state
vector X (`QG_Model_Spec.md` §1.1). **No result here shows how Resonance
Equilibrium relates to Nash equilibrium** — whether it is a special
case, a different concept entirely, or something that coincides with
Nash equilibrium under certain conditions is an open question, not
something this document has established.

### 2. Iterated resonance games — the evolution equation is not yet implemented

Traditional repeated games use discount factors. This document proposes
using atomic time (§2.1) as the clock and a J-evolution equation as the
state-transition function:

```
J(t + dt) = J(t) + delta(dT_atom) * f( Resonance(X_t) )
```

**Status: open, not implemented.** `delta()` and `f()` are not defined
anywhere in this repository. This is distinct from the tested coherence
mechanism in `QG_Model_Spec.md` §3.3, which computes a rate of change
(`coherence_rate`) from a sequence of already-observed J samples — that
part is implemented and tested. The equation above, describing how J
*generates* its own next value over time, is a separate, unresolved
proposal. Do not conflate the two.

### 3. Proof-of-Resonance as an incentive primitive

Instead of external incentives (tokens as carrots/sticks), PoR proposes
an internal alignment cost: faking resonance is expensive because it
requires consistent presence across time and J-space (see the
strategy-proofness sketch in `STRATEGY-PROOFNESS.md` — an informal
argument, not a formal proof; see `QG_Model_Spec.md` §5.4).

This connects to:
- **Mechanism design** — designing rules where truth-telling and genuine
  alignment are dominant strategies (see the open questions in
  `MECHANISM-DESIGN-CONNECTION.md`).
- **Implementation theory** — making desired social outcomes
  incentive-compatible through resonance proofs.

### 4. J-space and Bayesian games

J-space snapshots are proposed as a partial window into an AI agent's
internal state, potentially turning some Bayesian games (hidden
information) into games with partial observability of types. **Open
problem, not solved here:** an agent that knows its J-space readout will
be used this way has an incentive to produce a favorable readout rather
than an honest one — see the oracle/verifier conflict-of-interest note
in `AGENTS.md`. Partial observability does not by itself reduce
deception if the observed signal is producible by the party being
observed.

### 5. Evolutionary perspective

Over macro time scales, populations of agents (human + AI) could in
principle evolve under a resonance-based fitness function, blending
evolutionary game theory with dynamical systems. This is speculative and
has no supporting formalization in this repository yet.

## Open research questions

- Can resonance equilibria be computed or approximated efficiently, and how do they relate formally to Nash equilibria?
- What are the stability conditions for resonance equilibria under perturbations?
- How does J-space dimensionality affect cooperation in multi-agent settings?
- Can "resonance contracts" be designed to be self-enforcing through continuous PoR verification, given the oracle conflict-of-interest problem noted above?
- What are the implications for AI alignment if coordination primitives are based on verifiable resonance rather than external rewards — and how does that change if the verifier and the verified party can be the same agent?

---

**This is an active area of exploration within the QG framework.**
We invite mathematicians, game theorists, and mechanism designers to critique, formalize, or extend these ideas. Nothing in this document should be cited as an established result — see `QG_Model_Spec.md` for what is actually implemented and tested.

**Related documents:**
- [J-SPACE-INTEGRATION.md](J-SPACE-INTEGRATION.md)
- [TEMPORAL-DYNAMICS.md](TEMPORAL-DYNAMICS.md)
- [TOKENOMICS.md](TOKENOMICS.md)
- [LAGRANGIAN-FORMULATION.md](LAGRANGIAN-FORMULATION.md)
- [MECHANISM-DESIGN-CONNECTION.md](MECHANISM-DESIGN-CONNECTION.md)
- [STRATEGY-PROOFNESS.md](STRATEGY-PROOFNESS.md)
- [AGENTS.md](AGENTS.md)
- [QG_Model_Spec.md](QG_Model_Spec.md) — authoritative for anything implemented
