"""
qg_core.py — EARLY PROTOTYPE, SUPERSEDED.

This file predates the formal spec (QG_Model_Spec.md) and the tested
reference implementation (qg_model.py / qgmath/). The classes below are
a symbolic skeleton, not a working implementation of QG's actual math:

- Presence here is just an id + active flag — it does NOT compute the
  weighted RGB score defined in QG_Model_Spec.md §3.1 / qg_model.py's
  compute_presence().
- Resonance.check() always returns True for any two active presences
  (`a.active and b.active`) — it does NOT compute Omega, has no
  thresholds, no RGB, no J-space, no atomic time. This is a degenerate
  placeholder, not the resonance function.

Do not treat this file as the current model. For anything that needs to
match the real, tested formulas, use `qg_model.py` (Python) or
`qgmath/qgmath.go` (Go) instead. This file is kept for historical
reference only; consider deleting it once nothing else in this
repository depends on it, to avoid two classes named "Presence" and
"Resonance" with incompatible meanings living side by side.
"""


class Presence:
    def __init__(self, id):
        self.id = id
        self.active = True


class Attention:
    def __init__(self):
        self.focus_map = {}

    def direct(self, source, target):
        self.focus_map[source] = target
        return f"Attention directed from {source} to {target}"


class Resonance:
    def check(self, a: Presence, b: Presence):
        # NOTE: this is a placeholder condition, not the real resonance
        # function. See QG_Model_Spec.md §3.2 / qg_model.py's
        # compute_omega() for the actual, tested definition.
        return a.active and b.active


class QGSystem:
    def __init__(self):
        self.presences = []
        self.attention = Attention()
        self.resonance = Resonance()

    def add_presence(self, presence: Presence):
        self.presences.append(presence)

    def interact(self, a_id, b_id):
        a = self._get(a_id)
        b = self._get(b_id)
        if not a or not b:
            return "Missing presence"
        if self.resonance.check(a, b):
            return "Resonance achieved (PoR) — placeholder condition, see module docstring"
        return "No resonance"

    def _get(self, pid):
        for p in self.presences:
            if p.id == pid:
                return p
        return None


# Example usage
if __name__ == "__main__":
    qg = QGSystem()
    p1 = Presence("A")
    p2 = Presence("B")
    qg.add_presence(p1)
    qg.add_presence(p2)
    print(qg.attention.direct("A", "B"))
    print(qg.interact("A", "B"))
