# Lagrangian Formulation of uPoR-J

**Status: highly speculative — more so than the other research notes in
this repository.** Unlike `STRATEGY-PROOFNESS.md` (which has a proof
sketch with identified gaps) or `J-SPACE-INTEGRATION.md` (which has an
implemented, tested core), nothing in this document has an
implementation, and one of the problems below is a foundational mismatch,
not a missing detail.

*Note on formulas: plain text, not LaTeX — see `QG_Model_Spec.md` for why.*

## Goal

Translate the cryptographic/discrete protocol model into a continuous
variational form, to enable analysis of dynamics, stability, and
optimization using tools from classical mechanics.

## The fundamental mismatch (not yet resolved)

The state vector X (`QG_Model_Spec.md` §1.1) is updated at discrete
commit events (SNARK-verified steps), not continuously. A Lagrangian
formulation requires a continuous, differentiable trajectory X(t) — in
particular, a velocity term `dx_i/dt` requires x_i to actually vary
continuously in time. Going from "a value that changes at discrete
commit events" to "a continuously differentiable function of time"
requires an explicit interpolation scheme, plus a justification for why
that interpolation — rather than any other curve passing through the
same discrete points — is the physically/economically meaningful one.
**This step does not exist yet.** Everything below should be read as
"if such an interpolation existed and were justified, here is a
proposed form" — not as an applied result.

## Proposed Lagrangian

```
L = (1/2) * sum_i( m_i * (dx_i/dt)^2 )   [kinetic-energy-like term]
    - V(X)                                [potential-like term]
    + lambda * C_res(X)                   [resonance-condition constraint]
    + mu * D(Omega)                       [difficulty-like term]
```

**Undefined terms, all open:**

- `m_i` ("mass" of each state coordinate) — no definition. In classical
  mechanics mass has physical meaning; here it would need its own
  justification (e.g. as an inverse-variance or regularization weight),
  which has not been given.
- `V(X)` — described only as "deviation from ideal resonance," no closed
  form.
- `C_res(X)` — described only as "resonance condition." If `lambda` is
  meant as a Lagrange multiplier, the constraint it enforces (typically
  `C_res(X) = 0`) needs to be stated explicitly; it is not.
- `D(Omega)` — described only as "difficulty," borrowed terminology from
  proof-of-work contexts with no defined connection to Omega as computed
  in `QG_Model_Spec.md` §3.2.

## Equations of motion

```
d/dt ( dL/d(dx_i/dt) ) = dL/dx_i
```

This is the general Euler-Lagrange equation, stated in its standard
textbook form. **It has not been applied to the specific L above** — no
explicit system of ODEs has been derived from this document's own
Lagrangian. Until `m_i`, `V(X)`, `C_res(X)`, and `D(Omega)` are defined
and the mismatch above is resolved, this equation is a citation of a
known result, not a derived one specific to this protocol.

## Proposed applications (blocked on the above)

- Simulating long-term network behavior
- Finding bifurcation points (moments of strong resonance)
- Optimizing alpha, beta, gamma (`QG_Model_Spec.md` §3.2)

None of these can be carried out without first resolving the
discrete/continuous mismatch and defining the four terms above.

## Relationship to the tested reference implementation

None. `qg_model.py` / `qgmath/` implement the discrete formulas in
`QG_Model_Spec.md` §3 directly; they do not depend on, and are not
derived from, any Lagrangian formulation. This document remains an
independent, unimplemented research direction.
