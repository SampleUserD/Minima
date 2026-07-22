import { VNode } from "@/core/adapters/type.v-node"
import { AnalyzisPath } from "@/core/interpretator/dom/analyzer/type.analyze"
import { Handler, Instructions } from "@/core/interpretator/dom/instructions/type.instructions"
import { Functions, GetChild, GetResource, GetResourcesSize, Pack, Register, Strings } from "@/core/interpretator/dom/instructions/api.instructions"
import { RegisterListener } from "@/core/interpretator/dom/events/api.ensure"

function Analyze(node: VNode, path: AnalyzisPath, handler: Handler) {
  const handlers: [Handler, Handler][] = []

  for (const [key, value] of Object.entries(node.Properties)) {
    if (key.startsWith('on')) {
      handlers.push([Strings.Register(key.slice('on'.length)), Functions.Register(value)])
    }
  }

  return Pack(handler, handlers.flat(), {
    Path: [...path],
    URL: path.join('/')
  })
}

function Apply(node: HTMLElement, offset: number, data: Instructions) {
  const rsize = GetResourcesSize(offset, data)
  const child = GetChild(node, offset, data)

  for (let index = 0; index < rsize; index += 2) {
    const name = Strings.Get(GetResource(index, offset, data))
    const listener = Functions.Get(GetResource(index + 1, offset, data))

    RegisterListener(child, name, listener as any)
  }
}

export const HANDLER_ID = Register(Analyze, Apply)