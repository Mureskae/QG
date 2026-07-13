package keeper

import (
	"context"

	errorsmod "cosmossdk.io/errors"
	"cosmossdk.io/math"

	"qgchaind/x/resonance/types"
)

var (
	thetaP       = math.LegacyMustNewDecFromStr("0.5")
	thetaOmega   = math.LegacyMustNewDecFromStr("0.5")
	coherenceEps = math.LegacyMustNewDecFromStr("0.05")
)

func (k msgServer) SubmitResonance(ctx context.Context, msg *types.MsgSubmitResonance) (*types.MsgSubmitResonanceResponse, error) {
	if _, err := k.addressCodec.StringToBytes(msg.Creator); err != nil {
		return nil, errorsmod.Wrap(err, "invalid authority address")
	}

	p, err := math.LegacyNewDecFromStr(msg.P)
	if err != nil {
		return nil, errorsmod.Wrapf(err, "invalid p value: %s", msg.P)
	}
	omega, err := math.LegacyNewDecFromStr(msg.Omega)
	if err != nil {
		return nil, errorsmod.Wrapf(err, "invalid omega value: %s", msg.Omega)
	}
	coherenceRate, err := math.LegacyNewDecFromStr(msg.CoherenceRate)
	if err != nil {
		return nil, errorsmod.Wrapf(err, "invalid coherence_rate value: %s", msg.CoherenceRate)
	}

	presenceOk := p.GT(thetaP)
	resonanceOk := omega.GT(thetaOmega)
	coherenceOk := coherenceRate.LT(coherenceEps)

	minted := presenceOk || resonanceOk || coherenceOk

	return &types.MsgSubmitResonanceResponse{Minted: minted}, nil
}
