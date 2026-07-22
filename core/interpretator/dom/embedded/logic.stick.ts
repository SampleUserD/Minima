import { VNode } from "@/core/adapters/type.v-node"
import { AnalyzisPath } from "@/core/interpretator/dom/analyzer/type.analyze"
import { Handler, Instructions } from "@/core/interpretator/dom/instructions/type.instructions"
import { Functions, GetChild, GetResource, GetResourcesSize, Pack, Register, Strings } from "@/core/interpretator/dom/instructions/api.instructions"
import { GetSlots, RegisterSlots, Slot } from "@/core/interpretator/dom/slots/class.slots"

function Analyze(node: VNode, path: AnalyzisPath, handler: Handler) {
  const handlers: [Handler, Handler][] = []

  for (const [key, value] of Object.entries(node.Properties)) {
    if (key.startsWith('m-stick')) {
      handlers.push([Strings.Register(key.slice('m-stick'.length + 1)), Functions.Register(value)])
    }
  }

  return Pack(handler, handlers.flat(), {
    Path: [...path],
    URL: path.join('/')
  })
}

function Apply(node: HTMLElement, offset: number, data: Instructions) {
  const child = GetChild(node, offset, data)
  const rsize = GetResourcesSize(offset, data)
  const slots: Record<string, Slot> = GetSlots(child)

  for (let index = 0; index < rsize; index += 2) {
    const name = Strings.Get(GetResource(index, offset, data))
    const getter = Functions.Get(GetResource(index + 1, offset, data))

    if (name in slots == false) {
      slots[name] = getter()
    }
  }

  RegisterSlots(child, slots)
}

export const HANDLER_ID = Register(Analyze, Apply)