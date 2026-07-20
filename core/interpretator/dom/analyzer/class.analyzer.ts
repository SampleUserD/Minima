import { VNode } from "@/core/adapters/type.v-node"
import { M_SLOT_ATRRIBUTE, M_SLOT_FIX_ATRRIBUTE, M_TEXT_ATTRIBUTE } from "@/core/interpretator/dom/hydrate/hydrate.dom"
import { GetIndexFrom } from "@/core/interpretator/dom/patch.dom"
import { EnsureGlobalListener } from "@/core/interpretator/dom/transform/transform.dom"
import { Stateful } from "@/core/stateful/class.stateful"

export interface Instruction {
  URL: string,
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

export type InstructionGroup = {
  Group: Map<string, KindToInstructionMap>,
  Paths: Map<string, number[]>,
  Targets: HTMLElement[]
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
        URL: path.join('/'),
        Getter: value,
        Path: [...path],
      })

      continue
    }

    if (key.startsWith(M_SLOT_FIX_ATRRIBUTE)) {
      instructions.FixedSlot.push({
        URL: path.join('/'),
        Path: [...path],
        Getter: value,
        Name: key.slice(M_SLOT_FIX_ATRRIBUTE.length + 1)
      })

      continue
    }

    if (key.startsWith(M_SLOT_ATRRIBUTE)) {
      instructions.Slot.push({
        URL: path.join('/'),
        Path: [...path],
        Getter: value,
        Name: key.slice(M_SLOT_ATRRIBUTE.length + 1)
      })
    }

    if (key.startsWith('on')) {
      const name = key.slice('on'.length)

      instructions.Events.push({
        URL: path.join('/'),
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

export function GroupByPath(instructions: KindToInstructionMap): InstructionGroup {
  const groups: InstructionGroup = {
    Group: new Map(),
    Targets: [],
    Paths: new Map()
  }

  const create = (instruction: Instruction) => {
    let group = groups.Group.get(instruction.URL)

    if (group === undefined) {
      group = {
        Text: [],
        Slot: [],
        Events: [],
        FixedSlot: []
      }

      groups.Group.set(instruction.URL, group)
      groups.Paths.set(instruction.URL, instruction.Path)
    }

    return group
  }

  for (const instruction of instructions.Events) {
    const group = create(instruction)

    group.Events.push(instruction)
  }

  for (const instruction of instructions.FixedSlot) {
    const group = create(instruction)

    group.FixedSlot.push(instruction)
  }

  for (const instruction of instructions.Slot) {
    const group = create(instruction)

    group.Slot.push(instruction)
  }

  for (const instruction of instructions.Text) {
    const group = create(instruction)

    group.Text.push(instruction)
  }

  return groups
}

export function GetChildByPath(element: HTMLElement, path: number[]): HTMLElement | null {
  let target: HTMLElement | null = element

  for (const index of path) {
    target = target.children[index] as HTMLElement
  }

  return target
}

export const EVENT_INSTRUCTION = (target: HTMLElement, instruction: EventInstruction) => {
  const patch = target as any

  if (patch.listeners === undefined) {
    patch.listeners = new Map<string, (event: Event) => void>()
  }

  patch.listeners.set(instruction.Name, instruction.Callback)

  EnsureGlobalListener(instruction.Name)
}

export const FIXED_SLOT_INSTRUCTION = (target: HTMLElement, instruction: SlotInstruction) => {
  const patch = target as any

  if (patch.slots === undefined) {
    patch.slots = {}
  }

  if (instruction.Name in patch.slots == false) {
    patch.slots[instruction.Name] = instruction.Getter()
  }
}

export const SLOT_INSTRUCTION = (target: HTMLElement, instruction: SlotInstruction) => {
  const patch = target as any

  if (patch.slots === undefined) {
    patch.slots = {}
  }

  patch.slots[instruction.Name] = instruction.Getter()
}

export const TEXT_INSTRUCTION = (target: HTMLElement, instruction: TextInstruction) => {
  target.textContent = instruction.Getter()
}

export function ApplyInstructions(element: HTMLElement, instructions: KindToInstructionMap): void {
  for (const instruction of instructions.Events) {
    const target = GetChildByPath(element, instruction.Path)

    EVENT_INSTRUCTION(target!, instruction)
  }

  for (const instruction of instructions.FixedSlot) {
    const target = GetChildByPath(element, instruction.Path)

    FIXED_SLOT_INSTRUCTION(target!, instruction)
  }

  for (const instruction of instructions.Slot) {
    const target = GetChildByPath(element, instruction.Path)

    SLOT_INSTRUCTION(target!, instruction)
  }

  for (const instruction of instructions.Text) {
    const target = GetChildByPath(element, instruction.Path)

    TEXT_INSTRUCTION(target!, instruction)
  }
}

export function ApplyGroup(element: HTMLElement, group: InstructionGroup): void {
  const index = GetIndexFrom(element)

  for (const [path, instructions] of group.Group.entries()) {
    let target = group.Targets[index]

    if (target === undefined) {
      target = GetChildByPath(element, group.Paths.get(path)!)!
    }

    for (const instruction of instructions.Events) {
      EVENT_INSTRUCTION(target, instruction)
    }

    for (const instruction of instructions.FixedSlot) {
      FIXED_SLOT_INSTRUCTION(target, instruction)
    }

    for (const instruction of instructions.Slot) {
      SLOT_INSTRUCTION(target, instruction)
    }

    for (const instruction of instructions.Text) {
      TEXT_INSTRUCTION(target, instruction)
    }
  }
}