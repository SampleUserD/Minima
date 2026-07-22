import { VNode } from "@/core/adapters/type.v-node"
import { Instructions } from "@/core/interpretator/dom/instructions/type.instructions"

type Optional<T> = T | void

export type AnalyzisPath = number[]

export type AnalyzisResult = {
  Array: Instructions,
  Length: number
}

export type Analyzer = (node: VNode, path: AnalyzisPath, index: number) => Optional<number[]> 