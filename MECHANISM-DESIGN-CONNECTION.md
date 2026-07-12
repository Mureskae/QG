# Connection to Mechanism Design Theory

Mechanism design studies how to create rules of a game (mechanisms) to
achieve desired outcomes under strategic behavior by agents with private
information. This document proposes analogies between QG's primitives
and mechanism design concepts. **All comparisons below are proposed
research directions, not established results** — the same status as the
"Open Questions" section at the end; this document avoids stating
things as settled in one place and open in another (an inconsistency
present in an earlier draft).

## Classical mechanism design vs. QG (proposed analogy)

| Aspect | Classical mechanism design | QG approach (proposed, unproven) |
|---|---|---|
| Core primitive | Incentive compatibility, truthfulness | Verifiable resonance and presence |
| Tools | Payments, auctions, voting rules | Proof-of-Resonance (PoR) + partial SNARK coverage (`QG_Model_Spec.md` §5.1) |
| Handling private information | Revelation Principle, Bayesian implementation | J-space snapshots as *partial* type disclosure — **see the unresolved oracle/verifier conflict of interest in `AGENTS.md`: an agent that controls its own J-readout has an incentive to misreport it, which limits how much this actually reduces information asymmetry** |
| Design objective | Social welfare, revenue maximization | "Coherence-maximizing" — proposed objective, no formal definition or proof it's well-posed (see Open Questions) |
| Manipulation-resistance | Strategy-proofness (a proven property, when it holds) | Cost-of-faking argument in `STRATEGY-PROOFNESS.md` — an informal sketch, not a proof (`QG_Model_Spec.md` §5.4) |
| Time structure | One-shot or repeated static mechanisms | Continuous mechanism using Cs-133 ticks (`QG_Model_Spec.md` §2.1) |

## Proposed extensions (research directions, not results)

### 1. Proof-of-Resonance as a mechanism

Instead of external payments or penalties, QG proposes verifiable
presence as the primary signal. The intended properties — participation
requiring genuine alignment, rewards conditioned on successful PoR,
manipulation being costly — are **design goals**. The cost-of-faking
argument that would make manipulation actually costly is sketched, not
proven (`STRATEGY-PROOFNESS.md`).

### 2. J-space and information asymmetry — the conflict-of-interest caveat

J-space snapshots are proposed as partial, verifiable access to an
agent's internal state. **This is weaker than it may sound**: partial
observability only reduces deception if the observed party cannot bias
what gets observed. Per `AGENTS.md`, an agent that supplies its own
J-readout and is also evaluated on it has a direct incentive to produce
a favorable rather than honest readout. Any mechanism-design benefit
claimed here is conditional on resolving that conflict of interest,
which is not yet solved.

### 3. Dynamic and continuous mechanisms

Classical mechanism design mostly works in discrete rounds. This
document proposes a continuous mechanism using atomic time (§2.1) and
J-space evolution — the latter depends on the still-unimplemented J(t)
evolution equation flagged in `GAME-THEORY-CONNECTION.md` as `(open)`.
The "staking-like effect through coherence" described in an earlier
draft is an intuition, not a derived mechanism property.

### 4. Proposed properties — status corrected

- **Alignment-compatibility** — proposed name for a property where
  honest presence and resonance form a dominant strategy. **Not
  proven.** This is one of the open questions below, not an achieved
  property; an earlier draft of this table implied otherwise.
- **Coherence-maximizing** — proposed objective in place of individual
  utility maximization. No formal definition of "collective coherence"
  as an optimization target has been given; whether this is even a
  well-posed objective (e.g., does it admit a maximum, is it
  computable) is open.
- **Post-quantum and AI-native** — aspirational design goals (e.g., via
  LWE-based primitives), not yet backed by a completed cryptographic
  design in this repository.

## Open questions

- Can strategy-proofness or group-strategy-proofness be formally proven
  for resonance-based mechanisms — and does that proof need to first
  resolve the J-space oracle conflict of interest noted above?
- What would a Vickrey-Clarke-Groves (VCG) analog look like in terms of PoR?
- How can J-space be integrated into existing Bayesian mechanism design
  models, given that the "type signal" (J) is producible by the agent
  being modeled?
- What new impossibility or possibility results arise from introducing
  presence and resonance as primitives?

This document is an invitation to collaborate. Mathematicians and
researchers in mechanism design, algorithmic game theory, and AI
alignment are especially welcome to critique or formalize these ideas —
including by showing that some of the proposed properties above are
*not* achievable, which would be a useful result too.

**Related documents:**
- [GAME-THEORY-CONNECTION.md](GAME-THEORY-CONNECTION.md)
- [J-SPACE-INTEGRATION.md](J-SPACE-INTEGRATION.md)
- [TOKENOMICS.md](TOKENOMICS.md)
- [STRATEGY-PROOFNESS.md](STRATEGY-PROOFNESS.md)
- [AGENTS.md](AGENTS.md) — oracle/verifier conflict-of-interest discussion
- [QG_Model_Spec.md](QG_Model_Spec.md) — authoritative for anything implemented
