import { VNode } from "@/core/adapters/type.v-node"
import { M_SLOT_ATRRIBUTE, M_SLOT_FIX_ATRRIBUTE, M_TEXT_ATTRIBUTE } from "@/core/interpretator/dom/hydrate/hydrate.dom"
import { EnsureGlobalListener } from "@/core/interpretator/dom/transform/transform.dom"
import { Stateful } from "@/core/stateful/class.stateful"

export interface Instruction {
  Path: number[]
}

export interface TextInstruction extends Instruction {
  Getter: () => string
}

export interface SlotInstruction extends Instruction {
  Getter: () => any
  Name: string
}

export interface EventInstruction extends Instruction {
  Callback: (event: Event) => void
  Name: string
}

export type KindToInstructionMap = {
  Text: TextInstruction[],
  Slot: SlotInstruction[],
  Events: EventInstruction[]
  FixedSlot: SlotInstruction[],
}

export function Analyze(node: VNode, path: number[] = []): KindToInstructionMap {
  const instructions: KindToInstructionMap = {
    Text: [],
    Slot: [],
    Events: [],
    FixedSlot: []
  }

  for (const [key, value] of Object.entries(node.Properties)) {
    if (key === M_TEXT_ATTRIBUTE) {
      instructions.Text.push({
        Path: [...path],
        Getter: value
      })

      continue
    }

    if (key.startsWith(M_SLOT_FIX_ATRRIBUTE)) {
      instructions.FixedSlot.push({
        Path: [...path],
        Getter: value,
        Name: key.slice(M_SLOT_FIX_ATRRIBUTE.length + 1)
      })

      continue
    }

    if (key.startsWith(M_SLOT_ATRRIBUTE)) {
      instructions.Slot.push({
        Path: [...path],
        Getter: value,
        Name: key.slice(M_SLOT_ATRRIBUTE.length + 1)
      })
    }

    if (key.startsWith('on')) {
      const name = key.slice('on'.length)

      instructions.Events.push({
        Path: [...path],
        Callback: value,
        Name: name
      })
    }
  }

  for (let index = 0, length = node.Children.length; index < length; index++) {
    const child = node.Children[index]
    const exists = typeof child !== 'object' || child === null || child instanceof Stateful

    if (exists === false) {
      const child_path = [...path, index]
      const child_instruction = Analyze(child as VNode, child_path)

      instructions.Text = instructions.Text.concat(child_instruction.Text)
      instructions.Slot = instructions.Slot.concat(child_instruction.Slot)
      instructions.FixedSlot = instructions.FixedSlot.concat(child_instruction.FixedSlot)
      instructions.Events = instructions.Events.concat(child_instruction.Events)
    }
  }

  return instructions
}

export function GetChildByPath(element: HTMLElement, path: number[]): HTMLElement | null {
  let target: HTMLElement | null = element

  for (const index of path) {
    target = target.children[index] as HTMLElement
  }

  return target
}

export function Apply(element: HTMLElement, instructions: KindToInstructionMap): void {
  for (const event_instruction of instructions.Events) {
    const target = GetChildByPath(element, event_instruction.Path)

    if (target !== null) {
      const patch = target as any

      if (patch.listeners === undefined) {
        patch.listeners = new Map<string, (event: Event) => void>()
      }

      patch.listeners.set(event_instruction.Name, event_instruction.Callback)

      EnsureGlobalListener(event_instruction.Name)
    }
  }

  for (const slot_instruction of instructions.FixedSlot) {
    const target = GetChildByPath(element, slot_instruction.Path)

    if (target !== null) {
      const patch = target as any

      if (patch.slots === undefined) {
        patch.slots = {}
      }

      if (slot_instruction.Name in patch.slots == false) {
        patch.slots[slot_instruction.Name] = slot_instruction.Getter()
      }
    }
  }

  for (const slot_instruction of instructions.Slot) {
    const target = GetChildByPath(element, slot_instruction.Path)

    if (target !== null) {
      const patch = target as any

      if (patch.slots === undefined) {
        patch.slots = {}
      }

      patch.slots[slot_instruction.Name] = slot_instruction.Getter()
    }
  }

  for (const text_instruction of instructions.Text) {
    const target = GetChildByPath(element, text_instruction.Path)

    if (target !== null) {
      target.textContent = text_instruction.Getter()
    }
  }
}