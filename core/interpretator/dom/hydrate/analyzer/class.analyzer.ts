import { VNode } from "@/core/adapters/type.v-node"
import { M_SLOT_ATRRIBUTE, M_SLOT_FIX_ATRRIBUTE, M_TEXT_ATTRIBUTE } from "@/core/interpretator/dom/attributes/const.common"
import { CreateHollowInstructions, Instructions, IsTouched, MutableConcatInstructions, Touch } from "@/core/interpretator/dom/hydrate/analyzer/instructions/types.instruction"
import { GetDOMFrom } from "@/core/interpretator/dom/patch.dom"
import { Serializer } from "@/core/interpretator/dom/serializer/class.serializer"

function GetInstructionsFrom(node: VNode): Instructions {
  const instruction: Instructions = CreateHollowInstructions()

  for (const [key, value] of Object.entries(node.Properties)) {
    if (key === M_TEXT_ATTRIBUTE) {
      Touch(instruction)
      instruction.Text.push({ Getter: value })
    } else if (key.startsWith(M_SLOT_FIX_ATRRIBUTE)) {
      const name = key.slice(M_SLOT_FIX_ATRRIBUTE.length + 1)

      Touch(instruction)
      instruction.Fixed.push({ Getter: value, Name: name })
    } else if (key.startsWith(M_SLOT_ATRRIBUTE)) {
      const name = key.slice(M_SLOT_ATRRIBUTE.length + 1)

      Touch(instruction)
      instruction.Slot.push({ Getter: value, Name: name })
    } else if (key.startsWith("on")) {
      const name = key.slice("on".length)

      Touch(instruction)
      instruction.Events.push({ Callback: value, Name: name })
    }
  }

  return instruction
}

function Traverse(node: VNode, callback: (node: VNode) => void) {
  callback(node)

  for (const child of node.Children) {
    const matched = typeof child !== 'object' || child === null

    if (matched === false) {
      Traverse(child as VNode, callback)
    }
  }
}

export function WriteAnalyzeForIn(node: VNode): Instructions {
  const instructions = CreateHollowInstructions()

  Traverse(node, node => {
    const element = GetDOMFrom(node)
    const instruction = GetInstructionsFrom(node)

    if (IsTouched(instruction)) {
      MutableConcatInstructions(instructions, instruction)

      element.dataset.mi = Serializer.Serialize(instruction)
    }
  })

  return instructions
}
