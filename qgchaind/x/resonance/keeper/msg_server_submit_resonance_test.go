package keeper_test

import (
	"testing"

	"github.com/stretchr/testify/require"

	"qgchaind/x/resonance/keeper"
	"qgchaind/x/resonance/types"
)

func TestMsgSubmitResonance(t *testing.T) {
	f := initFixture(t)
	ms := keeper.NewMsgServerImpl(f.keeper)
	validCreator, err := f.addressCodec.BytesToString(f.keeper.GetAuthority())
	require.NoError(t, err)

	testCases := []struct {
		name        string
		input       *types.MsgSubmitResonance
		expErr      bool
		expErrMsg   string
		expMinted   bool
	}{
		{
			name: "invalid creator address",
			input: &types.MsgSubmitResonance{
				Creator: "not-a-valid-address",
				P:       "0.9",
				Omega:   "0.9",
				CoherenceRate: "0.01",
			},
			expErr:    true,
			expErrMsg: "invalid authority address",
		},
		{
			name: "invalid p value",
			input: &types.MsgSubmitResonance{
				Creator: validCreator,
				P:       "not-a-number",
				Omega:   "0.9",
				CoherenceRate: "0.01",
			},
			expErr:    true,
			expErrMsg: "invalid p value",
		},
		{
			name: "high presence mints token",
			input: &types.MsgSubmitResonance{
				Creator: validCreator,
				P:       "0.9",
				Omega:   "0.1",
				CoherenceRate: "0.9",
			},
			expErr:    false,
			expMinted: true,
		},
		{
			name: "high resonance mints token",
			input: &types.MsgSubmitResonance{
				Creator: validCreator,
				P:       "0.1",
				Omega:   "0.9",
				CoherenceRate: "0.9",
			},
			expErr:    false,
			expMinted: true,
		},
		{
			name: "low coherence rate mints token",
			input: &types.MsgSubmitResonance{
				Creator: validCreator,
				P:       "0.1",
				Omega:   "0.1",
				CoherenceRate: "0.01",
			},
			expErr:    false,
			expMinted: true,
		},
		{
			name: "everything below threshold mints nothing",
			input: &types.MsgSubmitResonance{
				Creator: validCreator,
				P:       "0.1",
				Omega:   "0.1",
				CoherenceRate: "0.9",
			},
			expErr:    false,
			expMinted: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			resp, err := ms.SubmitResonance(f.ctx, tc.input)
			if tc.expErr {
				require.Error(t, err)
				require.Contains(t, err.Error(), tc.expErrMsg)
			} else {
				require.NoError(t, err)
				require.Equal(t, tc.expMinted, resp.Minted)
			}
		})
	}
}
