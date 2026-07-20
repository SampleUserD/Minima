import { Instructions, EventInstruction, TextInstruction, SlotInstruction } from "@/core/interpretator/dom/hydrate/analyzer/instructions/types.instruction";
import { Serializer } from "@/core/interpretator/dom/serializer/class.serializer";
import { EnsureGlobalListener } from "@/core/interpretator/dom/transform/transform.dom";

function ApplyText(element: HTMLElement, instruction: TextInstruction) {
  element.textContent = instruction.Getter()
}

function ApplyFixed(element: HTMLElement, instruction: SlotInstruction) {
  const patch = element as any

  if (patch.slots === undefined) {
    patch.slots = {}
  }

  if (instruction.Name in patch.slots == false) {
    patch.slots[instruction.Name] = instruction.Getter()
  }
}

function ApplySlots(element: HTMLElement, instruction: SlotInstruction) {
  const patch = element as any

  if (patch.slots === undefined) {
    patch.slots = {}
  }

  patch.slots[instruction.Name] = instruction.Getter()
}

function ApplyEvents(element: HTMLElement, instruction: EventInstruction) {
  const patch = element as any

  if (patch.listeners === undefined) {
    patch.listeners = new Map<string, (event: Event) => void>()
  }

  patch.listeners.set(instruction.Name, instruction.Callback)

  EnsureGlobalListener(instruction.Name)
}

function ApplyInstructionsFor(element: HTMLElement, instructions: Instructions) {
  for (const instruction of instructions.Text) {
    ApplyText(element, instruction)
  }

  for (const instruction of instructions.Slot) {
    ApplySlots(element, instruction)
  }

  for (const instruction of instructions.Events) {
    ApplyEvents(element, instruction)
  }

  for (const instruction of instructions.Fixed) {
    ApplyFixed(element, instruction)
  }
}

export function ApplyFor(node: HTMLElement) {
  const instructions = Serializer.Deserialize(node.dataset.mi) as Instructions

  ApplyInstructionsFor(node, instructions)
}