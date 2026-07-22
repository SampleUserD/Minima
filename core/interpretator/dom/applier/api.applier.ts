import { Appliers, GetHandler, GetTotalSize } from "@/core/interpretator/dom/instructions/api.instructions";
import { AnalyzisResult } from "@/core/interpretator/dom/analyzer/type.analyze";
import "@/core/interpretator/dom/embedded/index"

export function Apply(node: HTMLElement, instructions: AnalyzisResult): void {
  let index = 0

  while (index < instructions.Length) {
    const applier = Appliers[GetHandler(index, instructions.Array)]

    applier(node, index, instructions.Array)
    index += GetTotalSize(index, instructions.Array)
  }
}