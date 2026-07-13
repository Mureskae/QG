package resonance

import (
	_ "cosmossdk.io/core/address"
	_ "github.com/cosmos/cosmos-sdk/types"
	"github.com/cosmos/cosmos-sdk/types/module"
	simtypes "github.com/cosmos/cosmos-sdk/types/simulation"
	"github.com/cosmos/cosmos-sdk/x/simulation"
	"math/rand"

	resonancesimulation "qgchaind/x/resonance/simulation"
	"qgchaind/x/resonance/types"
)

// GenerateGenesisState creates a randomized GenState of the module.
func (AppModule) GenerateGenesisState(simState *module.SimulationState) {
	accs := make([]string, len(simState.Accounts))
	for i, acc := range simState.Accounts {
		accs[i] = acc.Address.String()
	}
	resonanceGenesis := types.GenesisState{
		Params: types.DefaultParams(),
	}
	simState.GenState[types.ModuleName] = simState.Cdc.MustMarshalJSON(&resonanceGenesis)
}

// RegisterStoreDecoder registers a decoder.
func (am AppModule) RegisterStoreDecoder(_ simtypes.StoreDecoderRegistry) {}

// WeightedOperations returns the all the gov module operations with their respective weights.
func (am AppModule) WeightedOperations(simState module.SimulationState) []simtypes.WeightedOperation {
	operations := make([]simtypes.WeightedOperation, 0)
	const (
		opWeightMsgSubmitResonance          = "op_weight_msg_resonance"
		defaultWeightMsgSubmitResonance int = 100
	)

	var weightMsgSubmitResonance int
	simState.AppParams.GetOrGenerate(opWeightMsgSubmitResonance, &weightMsgSubmitResonance, nil,
		func(_ *rand.Rand) {
			weightMsgSubmitResonance = defaultWeightMsgSubmitResonance
		},
	)
	operations = append(operations, simulation.NewWeightedOperation(
		weightMsgSubmitResonance,
		resonancesimulation.SimulateMsgSubmitResonance(am.authKeeper, am.bankKeeper, am.keeper, simState.TxConfig),
	))

	return operations
}

// ProposalMsgs returns msgs used for governance proposals for simulations.
func (am AppModule) ProposalMsgs(simState module.SimulationState) []simtypes.WeightedProposalMsg {
	return []simtypes.WeightedProposalMsg{}
}