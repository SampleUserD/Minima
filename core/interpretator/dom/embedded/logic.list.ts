import { VNode } from "@/core/adapters/type.v-node"
import { AnalyzisPath } from "@/core/interpretator/dom/analyzer/type.analyze"
import { Instructions } from "@/core/interpretator/dom/instructions/type.instructions"
import { Functions, GetChild, GetResource, Pack, Register } from "@/core/interpretator/dom/instructions/api.instructions"
import { ListOrchestrator } from "@/core/interpretator/dom/list/api.list"

function Analyze(node: VNode, path: AnalyzisPath, index: number) {
  const each = node.Properties['m-for']
  const item = node.Properties['m-each']

  const matches = each === undefined || item === undefined

  if (matches === false) {
    return Pack(index, [Functions.Register(each), Functions.Register(item)], {
      Path: [...path],
      URL: path.join('/')
    })
  }
}

function Apply(node: HTMLElement, offset: number, data: Instructions) {
  const child = GetChild(node, offset, data)

  const each_id = GetResource(0, offset, data)
  const item_id = GetResource(1, offset, data)

  const each = Functions.Get(each_id)
  const item = Functions.Get(item_id)

  new ListOrchestrator(child, each(), item as any)
}

export const HANDLER_ID = Register(Analyze, Apply)