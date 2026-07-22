import { VNode } from "@/core/adapters/type.v-node"
import { AnalyzisPath } from "@/core/interpretator/dom/analyzer/type.analyze"
import { Instructions } from "@/core/interpretator/dom/instructions/type.instructions"
import { Functions, GetChild, GetResource, Pack, Register } from "@/core/interpretator/dom/instructions/api.instructions"

function Analyze(node: VNode, path: AnalyzisPath, index: number) {
  const property = node.Properties['m-text']

  if (property !== undefined) {
    return Pack(index, [Functions.Register(property)], {
      Path: [...path],
      URL: path.join('/')
    })
  }
}

function Apply(node: HTMLElement, offset: number, data: Instructions) {
  const child = GetChild(node, offset, data)
  const identificator = GetResource(0, offset, data)
  const getter = Functions.Get(identificator)

  child.textContent = getter()
}

export const HANDLER_ID = Register(Analyze, Apply)