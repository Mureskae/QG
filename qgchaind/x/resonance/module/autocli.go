package resonance

import (
	autocliv1 "cosmossdk.io/api/cosmos/autocli/v1"

	"qgchaind/x/resonance/types"
)

// AutoCLIOptions implements the autocli.HasAutoCLIConfig interface.
func (am AppModule) AutoCLIOptions() *autocliv1.ModuleOptions {
	return &autocliv1.ModuleOptions{
		Query: &autocliv1.ServiceCommandDescriptor{
			Service: types.Query_serviceDesc.ServiceName,
			RpcCommandOptions: []*autocliv1.RpcCommandOptions{
				{
					RpcMethod: "Params",
					Use:       "params",
					Short:     "Shows the parameters of the module",
				},
			},
		},
		Tx: &autocliv1.ServiceCommandDescriptor{
			Service:              types.Msg_serviceDesc.ServiceName,
			EnhanceCustomCommand: true, // only required if you want to use the custom command
			RpcCommandOptions: []*autocliv1.RpcCommandOptions{
				{
					RpcMethod: "UpdateParams",
					Skip:      true, // skipped because authority gated
				},
				{
					RpcMethod:      "SubmitResonance",
					Use:            "submit-resonance [p] [omega] [coherence-rate]",
					Short:          "Send a submit-resonance tx",
					PositionalArgs: []*autocliv1.PositionalArgDescriptor{{ProtoField: "p"}, {ProtoField: "omega"}, {ProtoField: "coherence_rate"}},
				},
			},
		},
	}
}
