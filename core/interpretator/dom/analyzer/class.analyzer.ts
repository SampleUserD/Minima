import { VNode } from "@/core/adapters/type.v-node"
import { Stateful } from "@/core/stateful/class.stateful"

export interface Instruction {
  Path: number[]
}

export interface TextInstruction extends Instruction {
  Getter: () => string
}

export type KindToInstructionMap = {
  Text: TextInstruction[]
}

export function Analyze(node: VNode, path: number[] = []): KindToInstructionMap {
  const instructions: KindToInstructionMap = {
    Text: []
  }

  if (node.Properties['m-text'] !== undefined) {
    instructions.Text.push({
      Path: [...path],
      Getter: node.Properties['m-text']
    })
  }

  for (let index = 0, length = node.Children.length; index < length; index++) {
    const child = node.Children[index]
    const exists = typeof child !== 'object' || child === null || child instanceof Stateful

    if (exists === false) {
      const child_path = [...path, index]
      const child_instruction = Analyze(child as VNode, child_path)

      instructions.Text = instructions.Text.concat(child_instruction.Text)
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
  for (const text_instruction of instructions.Text) {
    const target = GetChildByPath(element, text_instruction.Path)

    if (target !== null) {
      target.textContent = text_instruction.Getter()
    }
  }
}