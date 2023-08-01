from feature_gates import FeatureGates
FeatureGates.set_sourcemap_enabled(True)

import pyteal as pt
from pyteal import BareCallActions, Router, OnCompleteAction, CallConfig, OptimizeOptions

router = Router(
    name="Hello",
    bare_calls=BareCallActions(
        no_op=OnCompleteAction(action=pt.Approve(), call_config=CallConfig.CREATE),
    ),
)

@router.method
def hello(name: pt.abi.String):
    name_scratch = pt.ScratchVar(pt.TealType.bytes)
    return pt.Seq(
        name_scratch.store(name.get()),
        pt.Log(pt.Concat(pt.Bytes("Hello, "), name_scratch.load())),
        pt.If(pt.Len(name_scratch.load()) <= pt.Int(5)).Then(
            pt.Log(pt.Bytes("Your name is short!"))
        ).Else(
            pt.Log(pt.Bytes("Your name is long!"))
        )
    )

results = router.compile(
    version=6,
    optimize=OptimizeOptions(scratch_slots=True),
    with_sourcemaps=True,
    annotate_teal=True,
    pcs_in_sourcemap=True,
    annotate_teal_headers=True,
    annotate_teal_concise=False,
)

with open("approval.teal", "w") as f:
    print(results.approval_sourcemap.annotated_teal, file=f)