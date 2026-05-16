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
        # simple symbolic resonance condition
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
            return "Resonance achieved (PoR)"
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
