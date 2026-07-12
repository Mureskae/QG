"""
QG — Unified Model Spec v0.3 — reference implementation.

This is a reference implementation, not a production protocol.
It exists to make every formula in the consolidated spec checkable
against real numbers, so ambiguous or undefined terms surface immediately
instead of hiding inside prose.

Open problems (see spec section 5) are marked explicitly in code with
`# OPEN:` comments — nothing here should be read as "solved".
"""

from __future__ import annotations
from dataclasses import dataclass
import math
import time


# ---------------------------------------------------------------------------
# 1. Primitive measured quantities
# ---------------------------------------------------------------------------

@dataclass
class RawCapture:
    """Raw 16-bit-per-channel light/attention capture for one moment."""
    raw_r: int  # 0..65535
    raw_g: int
    raw_b: int
    atom_ticks: int  # count of Cs-133 hyperfine-transition periods since a fixed physical epoch
    merkle_root: str  # hex digest of the aggregated session data
    j_lens_raw: list[float]  # raw sparse-workspace activations at chosen layer

    def __post_init__(self):
        for name, v in [("raw_r", self.raw_r), ("raw_g", self.raw_g), ("raw_b", self.raw_b)]:
            if not (0 <= v <= 65535):
                raise ValueError(f"{name}={v} out of 16-bit range [0, 65535]")


def normalize_channel(raw: int) -> float:
    """raw 16-bit channel -> [0, 1]"""
    return raw / 65535.0


# ---------------------------------------------------------------------------
# 2. J — J-lens snapshot aggregation
# ---------------------------------------------------------------------------

def compute_j(j_lens_raw: list[float]) -> float:
    """
    g(): aggregates raw J-lens activations into a single scalar.

    OPEN: this is a placeholder choice (L2 norm, then squashed to (0,1)
    via tanh). The spec explicitly flags that g() has not been finalized.
    Swap this function out once a real choice is justified — do not treat
    the current formula as settled.
    """
    if not j_lens_raw:
        return 0.0
    l2 = math.sqrt(sum(x * x for x in j_lens_raw))
    return math.tanh(l2)  # squash into (0, 1) for comparability with other terms


# ---------------------------------------------------------------------------
# 3. Presence and Resonance
# ---------------------------------------------------------------------------

@dataclass
class ProtocolWeights:
    """All protocol constants live here, explicitly, so nothing is a magic
    number buried inside a formula. Every weight is uncalibrated (spec §5)."""
    w_r: float = 1 / 3
    w_g: float = 1 / 3
    w_b: float = 1 / 3

    alpha: float = 1 / 6   # weight on T_R inside resonance
    beta: float = 1 / 6    # weight on T_G
    gamma: float = 1 / 6   # weight on T_B
    delta: float = 1 / 6   # weight on merkle-derived term
    epsilon: float = 1 / 6  # weight on atom-time-derived term
    zeta: float = 1 / 6    # weight on J

    gain: float = 8.0  # sigmoid steepness for Omega; uncalibrated placeholder

    theta_p: float = 0.5   # presence threshold for minting Presence Token
    theta_omega: float = 0.5  # meaningful again now that Omega has real dynamic
    # range (see compute_omega() docstring) — 0.5 now means "leans resonant",
    # not "any non-empty input clears it".
    coherence_eps: float = 0.05  # max |dJ/dt| over window to mint Coherence Token

    def __post_init__(self):
        assert abs((self.w_r + self.w_g + self.w_b) - 1.0) < 1e-9, "w_R+w_G+w_B must sum to 1"


# ---------------------------------------------------------------------------
# 2b. T_atom — physical time as a Cs-133 hyperfine-transition tick counter,
#     represented in base-16, instead of an arbitrary Unix-epoch timestamp.
# ---------------------------------------------------------------------------

# The SI second is *defined* as exactly this many periods of the radiation
# corresponding to the hyperfine transition of the ground state of Cs-133.
# This is not a design choice — it is the international definition of the
# second (BIPM, since 1967). Using it as the tick unit means T_atom counts
# a real, physically fixed quantity rather than seconds since an arbitrary
# calendar epoch (Unix 1970-01-01 has no physical significance).
CS133_HZ = 9_192_631_770  # ticks per SI second


def seconds_to_cs133_ticks(seconds_since_epoch: float) -> int:
    """
    Convert an elapsed-seconds duration into a count of Cs-133 ticks.

    NOTE: `seconds_since_epoch` should be TAI (International Atomic Time)
    seconds, not Unix/UTC seconds, to avoid leap-second discontinuities.
    This reference implementation does not perform TAI<->UTC conversion —
    a production system needs an authoritative leap-second table (e.g.
    IERS Bulletin C) to do that conversion correctly. Treat the epoch
    reference below as illustrative, not authoritative.
    """
    return round(seconds_since_epoch * CS133_HZ)


def ticks_to_seconds(ticks: int) -> float:
    """Convert a Cs-133 tick count back to seconds (a plain unit conversion
    of the same physical duration — this does not reintroduce an arbitrary
    epoch, it just expresses the duration in a more legible unit for rate
    calculations like coherence_metric())."""
    return ticks / CS133_HZ


def ticks_to_hex(ticks: int) -> str:
    """Base-16 representation of the tick count — the '16-ричное время'
    is just this: physically-defined ticks, written in base 16, with no
    calendrical system attached to it."""
    return format(ticks, "x")


def normalize_atom_ticks(ticks: int, window_ticks: int) -> float:
    """
    Map an (unbounded, monotonically increasing) tick count into [0, 1)
    by taking its position within a rolling window of `window_ticks` ticks.
    This replaces the earlier Unix-timestamp normalization; the physical
    quantity being measured changed, the normalization technique (modulo
    + divide) did not need to.
    """
    if window_ticks <= 0:
        raise ValueError("window_ticks must be positive")
    return (ticks % window_ticks) / window_ticks


def merkle_root_to_unit_interval(merkle_root_hex: str) -> float:
    """
    Deterministically map a merkle root (hex string) to [0, 1] so it can
    enter a weighted sum alongside other normalized terms.
    This is a normalization convenience, not a security property.
    """
    as_int = int(merkle_root_hex, 16) if merkle_root_hex else 0
    modulus = 2 ** 256
    value = (as_int % modulus) / modulus
    # NOTE: for the largest possible 256-bit input, float division can
    # round exactly to 1.0 because doubles only carry ~53 bits of mantissa
    # against a 256-bit numerator. Clamp so the contract "result in [0,1)"
    # actually holds instead of silently breaking at the boundary.
    return min(value, 1.0 - 2 ** -53)


@dataclass
class StateVector:
    """X = [T_R, T_G, T_B, M, T_atom, J] — 6 dimensions.
    Omega is intentionally NOT a coordinate: it is computed and verified,
    not stored as a free component. This removes the circularity present
    in the earlier draft (where Omega was both an input to H() and a
    coordinate of the vector H() was supposed to consume)."""
    t_r: float
    t_g: float
    t_b: float
    m: float        # merkle root, normalized to [0, 1]
    t_atom: float   # Cs-133 tick count, normalized to [0, 1) via a rolling window
    j: float        # J-lens snapshot, already squashed to [0, 1]-ish range


def sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-x))


def compute_presence(x: StateVector, w: ProtocolWeights) -> float:
    """P = w_R*T_R + w_G*T_G + w_B*T_B"""
    return w.w_r * x.t_r + w.w_g * x.t_g + w.w_b * x.t_b


def compute_omega(x: StateVector, w: ProtocolWeights) -> float:
    """
    Omega = H( gain * ( alpha*(T_R-0.5) + beta*(T_G-0.5) + gamma*(T_B-0.5)
                        + delta*(M-0.5) + epsilon*(T_atom-0.5) + zeta*(J-0.5) ) )
    H = sigmoid, so Omega in (0, 1).

    Two changes from the naive version (alpha*T_R + ... straight into sigmoid):
    1. Each term is centered around 0 (subtracting 0.5) instead of averaging
       six non-negative terms — otherwise, by concentration of the sum of
       several bounded terms around their mean, Omega collapses into a
       narrow band (~0.57-0.65 observed empirically) regardless of whether
       the underlying state is actually "resonant". Centering means a
       genuinely neutral state (~all inputs 0.5) maps to Omega ≈ 0.5, and
       real variation in either direction actually moves Omega toward 0 or 1.
    2. A `gain` multiplies the centered sum before the sigmoid, controlling
       how sharply Omega responds — without a gain, six terms each in
       [-0.5, 0.5] weighted to sum to 1 can only ever reach a max of ±0.5,
       which barely moves the sigmoid off of 0.5 either. gain is itself an
       uncalibrated placeholder (see spec §5), not a validated constant.
    """
    centered = (
        w.alpha * (x.t_r - 0.5)
        + w.beta * (x.t_g - 0.5)
        + w.gamma * (x.t_b - 0.5)
        + w.delta * (x.m - 0.5)
        + w.epsilon * (x.t_atom - 0.5)
        + w.zeta * (x.j - 0.5)
    )
    return sigmoid(w.gain * centered)


# ---------------------------------------------------------------------------
# 4. Coherence over a time window (dJ/dt, not gradient — spec fix)
# ---------------------------------------------------------------------------

def coherence_metric(j_series: list[tuple[float, float]]) -> float:
    """
    j_series: list of (t_atom, J) pairs, sorted by time.
    Returns the max |dJ/dt| observed across consecutive samples.
    (Corrects the earlier spec's incorrect use of a gradient operator ∇J
    on what is actually a scalar time series — this uses a proper finite
    difference in time instead.)
    """
    if len(j_series) < 2:
        return 0.0
    max_rate = 0.0
    for (t0, j0), (t1, j1) in zip(j_series, j_series[1:]):
        dt = t1 - t0
        if dt <= 0:
            raise ValueError("j_series must be strictly increasing in time")
        rate = abs((j1 - j0) / dt)
        max_rate = max(max_rate, rate)
    return max_rate


# ---------------------------------------------------------------------------
# 5. Token minting decisions
# ---------------------------------------------------------------------------

@dataclass
class MintResult:
    presence_token: bool
    resonance_token: bool
    coherence_token: bool
    presence_value: float
    omega_value: float
    coherence_value: float | None


def evaluate_mint(
    x: StateVector,
    w: ProtocolWeights,
    j_series_for_coherence: list[tuple[float, float]] | None = None,
) -> MintResult:
    p = compute_presence(x, w)
    omega = compute_omega(x, w)

    coherence_val = None
    coherence_ok = False
    if j_series_for_coherence:
        coherence_val = coherence_metric(j_series_for_coherence)
        coherence_ok = coherence_val < w.coherence_eps

    return MintResult(
        presence_token=p > w.theta_p,
        resonance_token=omega > w.theta_omega,
        coherence_token=coherence_ok,
        presence_value=p,
        omega_value=omega,
        coherence_value=coherence_val,
    )


# ---------------------------------------------------------------------------
# 6. Worked example — run this file directly to see real numbers
# ---------------------------------------------------------------------------

def _demo():
    weights = ProtocolWeights()

    now_seconds = time.time()  # illustrative only — see seconds_to_cs133_ticks() note
    atom_ticks_now = seconds_to_cs133_ticks(now_seconds)

    capture = RawCapture(
        raw_r=40000,
        raw_g=52000,
        raw_b=18000,
        atom_ticks=atom_ticks_now,
        merkle_root="a3f5" + "0" * 60,  # placeholder digest
        j_lens_raw=[0.12, 0.35, -0.08, 0.51, 0.02],
    )

    t_r = normalize_channel(capture.raw_r)
    t_g = normalize_channel(capture.raw_g)
    t_b = normalize_channel(capture.raw_b)
    m = merkle_root_to_unit_interval(capture.merkle_root)

    # 1-hour rolling window, expressed in ticks rather than seconds
    window_ticks = seconds_to_cs133_ticks(3600)
    t_atom = normalize_atom_ticks(capture.atom_ticks, window_ticks)

    j = compute_j(capture.j_lens_raw)

    state = StateVector(t_r=t_r, t_g=t_g, t_b=t_b, m=m, t_atom=t_atom, j=j)

    # coherence_metric operates on a rate "per second", so ticks are converted
    # to seconds here — the tick count itself never touches an arbitrary
    # epoch, this is purely a unit conversion for the rate calculation.
    now_s = ticks_to_seconds(capture.atom_ticks)
    j_series = [
        (now_s - 20, j * 0.9),
        (now_s - 10, j * 0.95),
        (now_s, j),
    ]

    result = evaluate_mint(state, weights, j_series_for_coherence=j_series)

    print("--- QG reference run ---")
    print(f"T_R={t_r:.4f}  T_G={t_g:.4f}  T_B={t_b:.4f}")
    print(f"M={m:.6f}")
    print(f"T_atom (ticks)     = {capture.atom_ticks}")
    print(f"T_atom (hex)       = 0x{ticks_to_hex(capture.atom_ticks)}")
    print(f"T_atom (normalized)= {t_atom:.4f}")
    print(f"J={j:.4f}")
    print(f"Presence (P)   = {result.presence_value:.4f}  -> mint PT: {result.presence_token}")
    print(f"Resonance (Ω)  = {result.omega_value:.4f}  -> mint RT: {result.resonance_token}")
    print(f"Coherence rate = {result.coherence_value:.6f}  -> mint CT: {result.coherence_token}")


def _simulate_session(num_frames: int = 10, seed: int = 42):
    """
    Simulate a short session: a sequence of captures over time, run the
    full pipeline on each, and show how Presence/Omega/Coherence evolve.
    This is the "does the model hang together across time" check —
    a single frame (see _demo()) can't reveal drift, threshold flapping,
    or coherence behavior; a session can.
    """
    import random
    rng = random.Random(seed)
    weights = ProtocolWeights()

    start_ticks = seconds_to_cs133_ticks(time.time())
    frame_gap_ticks = seconds_to_cs133_ticks(5)  # 5 seconds between frames
    window_ticks = seconds_to_cs133_ticks(3600)

    j_history: list[tuple[float, float]] = []  # (seconds, J) for coherence window
    prev_j = 0.4

    print("--- QG session simulation ---")
    print(f"{'frame':>5} {'T_R':>6} {'T_G':>6} {'T_B':>6} {'J':>6} {'P':>6} "
          f"{'Ω':>6} {'coh_rate':>9}  PT RT CT")

    for i in range(num_frames):
        ticks_now = start_ticks + i * frame_gap_ticks

        raw_r = rng.randint(0, 65535)
        raw_g = rng.randint(0, 65535)
        raw_b = rng.randint(0, 65535)

        # J drifts slowly rather than jumping randomly, to make coherence
        # behavior legible in the printed table.
        prev_j = max(0.0, min(1.0, prev_j + rng.uniform(-0.05, 0.05)))
        capture = RawCapture(
            raw_r=raw_r, raw_g=raw_g, raw_b=raw_b,
            atom_ticks=ticks_now,
            merkle_root=format(rng.getrandbits(256), "x"),
            j_lens_raw=[prev_j, prev_j * 0.5, prev_j * 0.2],
        )

        t_r = normalize_channel(capture.raw_r)
        t_g = normalize_channel(capture.raw_g)
        t_b = normalize_channel(capture.raw_b)
        m = merkle_root_to_unit_interval(capture.merkle_root)
        t_atom = normalize_atom_ticks(capture.atom_ticks, window_ticks)
        j = compute_j(capture.j_lens_raw)

        state = StateVector(t_r=t_r, t_g=t_g, t_b=t_b, m=m, t_atom=t_atom, j=j)

        now_s = ticks_to_seconds(capture.atom_ticks)
        j_history.append((now_s, j))
        # only use the last few samples for the coherence window
        window = j_history[-3:]

        result = evaluate_mint(
            state, weights,
            j_series_for_coherence=window if len(window) >= 2 else None,
        )

        coh_str = f"{result.coherence_value:.5f}" if result.coherence_value is not None else "   n/a"
        print(
            f"{i:>5} {t_r:>6.3f} {t_g:>6.3f} {t_b:>6.3f} {j:>6.3f} "
            f"{result.presence_value:>6.3f} {result.omega_value:>6.3f} {coh_str:>9}  "
            f"{'Y' if result.presence_token else '.'}  "
            f"{'Y' if result.resonance_token else '.'}  "
            f"{'Y' if result.coherence_token else '.'}"
        )


if __name__ == "__main__":
    _demo()
    print()
    _simulate_session()
