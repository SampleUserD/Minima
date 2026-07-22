import { VNode } from "@/core/adapters/type.v-node"
import { Analyzers, URLs } from "@/core/interpretator/dom/instructions/api.instructions"
import { AnalyzisPath, AnalyzisResult } from "@/core/interpretator/dom/analyzer/type.analyze"
import { Instructions } from "@/core/interpretator/dom/instructions/type.instructions"
// import "@/core/interpretator/dom/embed/index"

function Traverse(node: VNode, callback: (node: VNode, path: AnalyzisPath) => void, path: AnalyzisPath = []) {
  callback(node, path)

  for (let index = 0; index < node.Children.length; index++) {
    const child = node.Children[index]

    if (typeof child === 'object') {
      Traverse(child, callback, [...path, index])
    }
  }
}

export const MAXIMAL_INSTRUCTION_BUFFER = 2 ** 16

export function Analyze(node: VNode): AnalyzisResult {
  const buffer = new ArrayBuffer(MAXIMAL_INSTRUCTION_BUFFER)
  const array = new Uint32Array(buffer)

  let offset = 0

  Traverse(node, (node, path) => {
    for (let index = 0, length = Analyzers.length; index < length; index++) {
      const analyzer = Analyzers[index]
      const result = analyzer(node, path, index)

      if (result) {
        array.set(result, offset)
        offset += result.length
      }
    }
  })

  return {
    Array: array,
    Length: offset
  }
}