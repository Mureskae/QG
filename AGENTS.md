# AGENTS.md — Interaction with AI Agents in QG

## Role of agents in QG

AI agents are first-class participants in the QG ecosystem, not just tools.

## Key interaction patterns

### 1. Human-AI resonance

Human presence (see `QG_Model_Spec.md` state vector X, §1.1) and an
agent's J-space snapshot (§2.3) can both feed into a resonance
calculation. **Open problem:** the spec's resonance function (§3.2) is
defined for a single participant's state vector. Combining a human's X
with an agent's J into one joint resonance value requires an explicit
aggregation function that does not yet exist — see Open Questions below.
Until that aggregation is defined, "joint Resonance Tokens" should be
treated as a design goal, not an implemented mechanism.

### 2. AI-AI resonance

Agents can, in principle, form resonant clusters, with coherence across
multiple J-space snapshots contributing to value. **Open problem:** same
as above — no aggregation function across multiple agents' J values has
been specified or implemented.

### 3. Agent as resonance oracle — explicit conflict-of-interest note

Per `QG_Model_Spec.md` §5.1, a model operator/agent is the trusted
oracle supplying J (SNARK coverage does not extend to J's computation —
only the downstream arithmetic on it is verified). If the same agent
also *verifies* resonance and *earns* a Resonance Token from a favorable
result, that is a direct conflict of interest: the verifier has a
financial stake in its own verification's outcome. This is not a solved
problem here — it needs either (a) a separate, disinterested verifier
role, or (b) a mechanism that removes the agent's incentive to bias its
own readout (e.g. staking/slashing tied to later-detected dishonesty).
Neither is specified yet.

## Technical requirements for agents

- Support for J-space snapshot extraction or approximation (§2.3).
- Ability to operate with atomic time synchronization (§2.1, Cs-133
  ticks — not wall-clock/Unix time).
- Participation in the PoR protocol under the SNARK coverage that
  actually exists today: the threshold arithmetic on P/Omega (§3.1–3.2)
  is SNARK-verifiable; the correctness of a claimed J value is not
  (§5.1). Any claim that an agent's honesty is fully "enforced by
  SNARK" overstates current coverage — retired from this document.

## Open questions

- How to aggregate multiple participants' state into a single joint
  resonance value (human-AI and AI-AI cases)?
- How to measure and reward genuine agent alignment, distinct from
  gameable proxies?
- What mechanism resolves the oracle/verifier conflict of interest
  described above?
- Can agents evolve their own internal coherence through QG, and if so,
  how is that distinguished from an agent simply learning to produce
  favorable J readouts?
- What safeguards prevent deceptive agent behavior, given that the
  agent controls the very signal (J) used to judge it?

This layer is under active exploration; nothing above should be read as
a solved mechanism.
