// Package qgmath is a pure-Go port of qg_model.py's core formulas, with
// zero external dependencies. This file is meant to be copied into your
// Cosmos SDK module's keeper package (e.g. x/qg/keeper/qgmath.go) once you
// have scaffolded the chain locally — see the setup instructions from Claude
// for the `ignite scaffold` commands.
//
// It was compiled and tested in a sandboxed environment without network
// access to the Cosmos SDK module proxy, so it has NO cosmos-sdk imports —
// only the Go standard library. That part is verified (see qgmath_test.go).
// The Cosmos SDK wiring (keeper, Msg handlers, genesis state) is NOT
// verified here — you'll need to build and test that yourself locally and
// report back any compile errors.
package qgmath

import (
	"errors"
	"math"
)

// Cs133Hz is the SI-defined number of periods of the Cs-133 hyperfine
// transition per second. This is the international definition of the
// second (BIPM, since 1967), not a design choice.
const Cs133Hz = 9_192_631_770

// SecondsToCs133Ticks converts an elapsed-seconds duration into a tick count.
// NOTE: seconds should be TAI seconds, not Unix/UTC — this function does not
// perform TAI<->UTC leap-second conversion. See qg_model.py's docstring for
// the same caveat; it applies identically here.
func SecondsToCs133Ticks(seconds float64) int64 {
	return int64(math.Round(seconds * Cs133Hz))
}

// TicksToSeconds converts a tick count back to seconds (plain unit
// conversion of the same physical duration).
func TicksToSeconds(ticks int64) float64 {
	return float64(ticks) / Cs133Hz
}

// NormalizeAtomTicks maps a tick count into [0, 1) via a rolling window.
func NormalizeAtomTicks(ticks int64, windowTicks int64) (float64, error) {
	if windowTicks <= 0 {
		return 0, errors.New("windowTicks must be positive")
	}
	m := ticks % windowTicks
	if m < 0 {
		m += windowTicks // Go's % can return negative for negative inputs
	}
	return float64(m) / float64(windowTicks), nil
}

// NormalizeChannel maps a raw 16-bit channel value (0..65535) to [0, 1].
func NormalizeChannel(raw uint16) float64 {
	return float64(raw) / 65535.0
}

// Sigmoid is the logistic function, H(x) in the spec.
func Sigmoid(x float64) float64 {
	return 1.0 / (1.0 + math.Exp(-x))
}

// Weights holds every protocol constant explicitly, matching
// ProtocolWeights in qg_model.py. All values here are uncalibrated
// placeholders — see the spec's open-problems section.
type Weights struct {
	WR, WG, WB                     float64
	Alpha, Beta, Gamma              float64
	Delta, Epsilon, Zeta            float64
	Gain                            float64
	ThetaP, ThetaOmega, CoherenceEps float64
}

// DefaultWeights mirrors the Python ProtocolWeights() defaults, including
// the gain=8.0 fix for Omega's dynamic range (see qg_model.py history:
// the naive un-centered, un-scaled version collapsed into a narrow band
// regardless of input — this default avoids that bug).
func DefaultWeights() Weights {
	return Weights{
		WR: 1.0 / 3, WG: 1.0 / 3, WB: 1.0 / 3,
		Alpha: 1.0 / 6, Beta: 1.0 / 6, Gamma: 1.0 / 6,
		Delta: 1.0 / 6, Epsilon: 1.0 / 6, Zeta: 1.0 / 6,
		Gain:         8.0,
		ThetaP:       0.5,
		ThetaOmega:   0.5,
		CoherenceEps: 0.05,
	}
}

// State is the 6-dimensional state vector X = [T_R, T_G, T_B, M, T_atom, J].
// Omega is deliberately NOT a field here — it is computed, not stored,
// which removes the circular definition present in the earliest spec draft.
type State struct {
	TR, TG, TB float64
	M          float64
	TAtom      float64
	J          float64
}

// ComputePresence: P = w_R*T_R + w_G*T_G + w_B*T_B
func ComputePresence(s State, w Weights) float64 {
	return w.WR*s.TR + w.WG*s.TG + w.WB*s.TB
}

// ComputeOmega: Omega = H( gain * (weighted sum of centered terms) ).
// See qg_model.py's compute_omega() docstring for why centering + gain
// are both required — without them, Omega collapses into a narrow band
// regardless of the actual input (an empirically observed bug, not a
// theoretical concern).
func ComputeOmega(s State, w Weights) float64 {
	centered := w.Alpha*(s.TR-0.5) +
		w.Beta*(s.TG-0.5) +
		w.Gamma*(s.TB-0.5) +
		w.Delta*(s.M-0.5) +
		w.Epsilon*(s.TAtom-0.5) +
		w.Zeta*(s.J-0.5)
	return Sigmoid(w.Gain * centered)
}

// TimedJ pairs a J-lens scalar reading with the atomic-time (in seconds)
// it was taken at, for coherence-rate calculations.
type TimedJ struct {
	Seconds float64
	J       float64
}

// CoherenceMetric returns the max |dJ/dt| across consecutive samples.
// Uses a proper time derivative (finite difference), not a gradient
// operator — the earlier TEMPORAL-DYNAMICS.md spec draft incorrectly
// used ∇J on what is actually a scalar time series.
func CoherenceMetric(series []TimedJ) (float64, error) {
	if len(series) < 2 {
		return 0, nil
	}
	maxRate := 0.0
	for i := 1; i < len(series); i++ {
		dt := series[i].Seconds - series[i-1].Seconds
		if dt <= 0 {
			return 0, errors.New("series must be strictly increasing in time")
		}
		rate := math.Abs((series[i].J - series[i-1].J) / dt)
		if rate > maxRate {
			maxRate = rate
		}
	}
	return maxRate, nil
}

// MintResult mirrors MintResult in qg_model.py.
type MintResult struct {
	PresenceToken  bool
	ResonanceToken bool
	CoherenceToken bool
	PresenceValue  float64
	OmegaValue     float64
	CoherenceValue float64
	HasCoherence   bool // Go has no Optional[float]; this flags whether CoherenceValue is meaningful
}

// EvaluateMint mirrors evaluate_mint() in qg_model.py.
func EvaluateMint(s State, w Weights, coherenceSeries []TimedJ) (MintResult, error) {
	p := ComputePresence(s, w)
	omega := ComputeOmega(s, w)

	result := MintResult{
		PresenceValue:  p,
		OmegaValue:     omega,
		PresenceToken:  p > w.ThetaP,
		ResonanceToken: omega > w.ThetaOmega,
	}

	if len(coherenceSeries) >= 2 {
		rate, err := CoherenceMetric(coherenceSeries)
		if err != nil {
			return MintResult{}, err
		}
		result.CoherenceValue = rate
		result.HasCoherence = true
		result.CoherenceToken = rate < w.CoherenceEps
	}

	return result, nil
}
