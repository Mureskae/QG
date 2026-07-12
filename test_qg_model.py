import math
import pytest
from qg_model import (
    RawCapture, normalize_channel, merkle_root_to_unit_interval,
    compute_j, StateVector, ProtocolWeights,
    compute_presence, compute_omega, coherence_metric, evaluate_mint, sigmoid,
    CS133_HZ, seconds_to_cs133_ticks, ticks_to_hex, ticks_to_seconds,
    normalize_atom_ticks,
)


def test_raw_capture_rejects_out_of_range_channel():
    with pytest.raises(ValueError):
        RawCapture(raw_r=70000, raw_g=0, raw_b=0, atom_ticks=0,
                   merkle_root="0", j_lens_raw=[])


def test_seconds_to_cs133_ticks_one_second():
    assert seconds_to_cs133_ticks(1.0) == CS133_HZ


def test_ticks_to_seconds_roundtrip():
    ticks = seconds_to_cs133_ticks(42.0)
    assert math.isclose(ticks_to_seconds(ticks), 42.0, rel_tol=1e-9)


def test_ticks_to_hex_format():
    assert ticks_to_hex(255) == "ff"
    assert ticks_to_hex(0) == "0"


def test_normalize_atom_ticks_wraps_within_window():
    window = seconds_to_cs133_ticks(3600)
    v = normalize_atom_ticks(window + 5, window)  # one tick past a full window
    assert 0.0 <= v < 1.0
    assert math.isclose(v, 5 / window)


def test_normalize_atom_ticks_rejects_nonpositive_window():
    with pytest.raises(ValueError):
        normalize_atom_ticks(100, 0)


def test_normalize_channel_bounds():
    assert normalize_channel(0) == 0.0
    assert normalize_channel(65535) == 1.0


def test_merkle_root_in_unit_interval():
    v = merkle_root_to_unit_interval("ff" * 32)
    assert 0.0 <= v < 1.0


def test_merkle_root_empty_defaults_zero():
    assert merkle_root_to_unit_interval("") == 0.0


def test_compute_j_empty_series_is_zero():
    assert compute_j([]) == 0.0


def test_compute_j_bounded_by_tanh():
    # tanh output is always in (-1, 1); with non-negative L2 norm input,
    # result should be in [0, 1)
    val = compute_j([10.0, 10.0, 10.0])
    assert 0.0 <= val < 1.0


def test_weights_must_sum_to_one():
    with pytest.raises(AssertionError):
        ProtocolWeights(w_r=0.5, w_g=0.5, w_b=0.5)  # sums to 1.5


def test_presence_is_weighted_average_at_default_weights():
    w = ProtocolWeights()
    x = StateVector(t_r=0.9, t_g=0.9, t_b=0.9, m=0.0, t_atom=0.0, j=0.0)
    p = compute_presence(x, w)
    assert math.isclose(p, 0.9, rel_tol=1e-9)


def test_omega_is_pure_function_of_state_no_circularity():
    # Omega must be computable from X alone with no dependency on a
    # previously-stored Omega value anywhere (this is the fix for the
    # circular definition in the earlier spec draft).
    w = ProtocolWeights()
    x = StateVector(t_r=0.5, t_g=0.5, t_b=0.5, m=0.5, t_atom=0.5, j=0.5)
    omega1 = compute_omega(x, w)
    omega2 = compute_omega(x, w)
    assert omega1 == omega2  # deterministic, no hidden state
    assert 0.0 < omega1 < 1.0  # sigmoid range


def test_coherence_metric_uses_time_derivative_not_gradient():
    # constant J over time -> coherence rate is exactly 0
    series = [(0.0, 0.5), (10.0, 0.5), (20.0, 0.5)]
    assert coherence_metric(series) == 0.0

    # linear change in J over time -> rate should match slope
    series2 = [(0.0, 0.0), (10.0, 1.0)]
    assert math.isclose(coherence_metric(series2), 0.1)


def test_coherence_metric_rejects_non_increasing_time():
    with pytest.raises(ValueError):
        coherence_metric([(10.0, 0.1), (5.0, 0.2)])


def test_coherence_metric_needs_at_least_two_points():
    assert coherence_metric([(0.0, 0.5)]) == 0.0


def test_omega_has_real_dynamic_range_not_narrow_band():
    # Regression guard for the bug where averaging six non-negative terms
    # made Omega collapse into a narrow ~0.57-0.65 band regardless of input.
    # A clearly "low" state and a clearly "high" state must land on
    # opposite sides of 0.5, not both cluster near it.
    w = ProtocolWeights()
    low = StateVector(t_r=0.05, t_g=0.05, t_b=0.05, m=0.05, t_atom=0.05, j=0.05)
    high = StateVector(t_r=0.95, t_g=0.95, t_b=0.95, m=0.95, t_atom=0.95, j=0.95)
    omega_low = compute_omega(low, w)
    omega_high = compute_omega(high, w)
    assert omega_low < 0.3
    assert omega_high > 0.7


def test_evaluate_mint_thresholds():
    w = ProtocolWeights(theta_p=0.9, theta_omega=0.9)
    x_low = StateVector(t_r=0.1, t_g=0.1, t_b=0.1, m=0.1, t_atom=0.1, j=0.1)
    result = evaluate_mint(x_low, w)
    assert result.presence_token is False
    assert result.resonance_token is False
    assert result.coherence_token is False  # no series provided


def test_sigmoid_midpoint():
    assert math.isclose(sigmoid(0.0), 0.5)


def test_aggregate_j_oracles_uses_median():
    from qg_model import OracleReading, aggregate_j_oracles
    readings = [
        OracleReading("op_a", 0.40),
        OracleReading("op_b", 0.42),
        OracleReading("op_c", 0.41),
    ]
    result = aggregate_j_oracles(readings, min_quorum=3, outlier_threshold=0.05)
    assert math.isclose(result.aggregated_j, 0.41)
    assert result.num_readings == 3
    assert result.outlier_oracle_ids == []


def test_aggregate_j_oracles_flags_outlier():
    from qg_model import OracleReading, aggregate_j_oracles
    readings = [
        OracleReading("op_a", 0.40),
        OracleReading("op_b", 0.41),
        OracleReading("op_c", 0.95),  # dishonest/broken oracle
    ]
    result = aggregate_j_oracles(readings, min_quorum=3, outlier_threshold=0.05)
    assert math.isclose(result.aggregated_j, 0.41)  # median unaffected
    assert result.outlier_oracle_ids == ["op_c"]


def test_aggregate_j_oracles_rejects_insufficient_quorum():
    from qg_model import OracleReading, aggregate_j_oracles
    readings = [OracleReading("op_a", 0.40), OracleReading("op_b", 0.41)]
    with pytest.raises(ValueError):
        aggregate_j_oracles(readings, min_quorum=3, outlier_threshold=0.05)
