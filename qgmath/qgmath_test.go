package qgmath

import (
	"math"
	"testing"
)

func almostEqual(a, b, tol float64) bool {
	return math.Abs(a-b) < tol
}

func TestSecondsToCs133TicksOneSecond(t *testing.T) {
	if SecondsToCs133Ticks(1.0) != Cs133Hz {
		t.Errorf("expected %d ticks for 1 second, got %d", int64(Cs133Hz), SecondsToCs133Ticks(1.0))
	}
}

func TestTicksToSecondsRoundtrip(t *testing.T) {
	ticks := SecondsToCs133Ticks(42.0)
	got := TicksToSeconds(ticks)
	if !almostEqual(got, 42.0, 1e-6) {
		t.Errorf("roundtrip failed: got %f, want ~42.0", got)
	}
}

func TestNormalizeAtomTicksWithinWindow(t *testing.T) {
	window := SecondsToCs133Ticks(3600)
	v, err := NormalizeAtomTicks(window+5, window)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if v < 0.0 || v >= 1.0 {
		t.Errorf("expected v in [0,1), got %f", v)
	}
}

func TestNormalizeAtomTicksRejectsNonPositiveWindow(t *testing.T) {
	_, err := NormalizeAtomTicks(100, 0)
	if err == nil {
		t.Error("expected error for non-positive window, got nil")
	}
}

func TestNormalizeChannelBounds(t *testing.T) {
	if NormalizeChannel(0) != 0.0 {
		t.Error("expected 0.0 for raw=0")
	}
	if NormalizeChannel(65535) != 1.0 {
		t.Error("expected 1.0 for raw=65535")
	}
}

func TestSigmoidMidpoint(t *testing.T) {
	if !almostEqual(Sigmoid(0.0), 0.5, 1e-9) {
		t.Errorf("expected sigmoid(0)=0.5, got %f", Sigmoid(0.0))
	}
}

func TestPresenceWeightedAverage(t *testing.T) {
	w := DefaultWeights()
	s := State{TR: 0.9, TG: 0.9, TB: 0.9}
	p := ComputePresence(s, w)
	if !almostEqual(p, 0.9, 1e-9) {
		t.Errorf("expected presence ~0.9, got %f", p)
	}
}

// Regression test for the narrow-band Omega bug found while testing the
// Python version: without centering + gain, Omega collapses into a band
// around ~0.57-0.65 regardless of whether the input is "low" or "high".
func TestOmegaHasRealDynamicRange(t *testing.T) {
	w := DefaultWeights()
	low := State{TR: 0.05, TG: 0.05, TB: 0.05, M: 0.05, TAtom: 0.05, J: 0.05}
	high := State{TR: 0.95, TG: 0.95, TB: 0.95, M: 0.95, TAtom: 0.95, J: 0.95}

	omegaLow := ComputeOmega(low, w)
	omegaHigh := ComputeOmega(high, w)

	if omegaLow >= 0.3 {
		t.Errorf("expected low-input Omega < 0.3, got %f", omegaLow)
	}
	if omegaHigh <= 0.7 {
		t.Errorf("expected high-input Omega > 0.7, got %f", omegaHigh)
	}
}

func TestOmegaIsDeterministicNoHiddenState(t *testing.T) {
	w := DefaultWeights()
	s := State{TR: 0.5, TG: 0.5, TB: 0.5, M: 0.5, TAtom: 0.5, J: 0.5}
	o1 := ComputeOmega(s, w)
	o2 := ComputeOmega(s, w)
	if o1 != o2 {
		t.Errorf("expected deterministic Omega, got %f then %f", o1, o2)
	}
	if o1 <= 0.0 || o1 >= 1.0 {
		t.Errorf("expected Omega strictly in (0,1), got %f", o1)
	}
}

func TestCoherenceMetricUsesTimeDerivative(t *testing.T) {
	// constant J -> rate 0
	constSeries := []TimedJ{{0.0, 0.5}, {10.0, 0.5}, {20.0, 0.5}}
	rate, err := CoherenceMetric(constSeries)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rate != 0.0 {
		t.Errorf("expected rate 0.0 for constant J, got %f", rate)
	}

	// linear change -> rate should match the slope
	linearSeries := []TimedJ{{0.0, 0.0}, {10.0, 1.0}}
	rate2, err := CoherenceMetric(linearSeries)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !almostEqual(rate2, 0.1, 1e-9) {
		t.Errorf("expected rate ~0.1, got %f", rate2)
	}
}

func TestCoherenceMetricRejectsNonIncreasingTime(t *testing.T) {
	series := []TimedJ{{10.0, 0.1}, {5.0, 0.2}}
	_, err := CoherenceMetric(series)
	if err == nil {
		t.Error("expected error for non-increasing time, got nil")
	}
}

func TestEvaluateMintThresholds(t *testing.T) {
	w := DefaultWeights()
	w.ThetaP = 0.9
	w.ThetaOmega = 0.9
	low := State{TR: 0.1, TG: 0.1, TB: 0.1, M: 0.1, TAtom: 0.1, J: 0.1}

	result, err := EvaluateMint(low, w, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.PresenceToken {
		t.Error("expected no presence token for low state at high threshold")
	}
	if result.ResonanceToken {
		t.Error("expected no resonance token for low state at high threshold")
	}
	if result.HasCoherence {
		t.Error("expected HasCoherence false when no series provided")
	}
}
