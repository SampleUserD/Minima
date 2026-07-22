import { VNode } from "@/core/adapters/type.v-node"

function ApplyStaticAttributes(element: HTMLElement, node: VNode): void {
  for (const [key, value] of Object.entries(node.Properties)) {
    const matches = key.startsWith('m-') || key.startsWith('on')

    if (matches === false) {
      element.setAttribute(key, value)
    }
  }
}

export function Transform(node: VNode): HTMLElement {
  if (typeof node.Type === 'string') {
    const element = document.createElement(node.Type) as any
    const contents: string[] = []

    element.appendChild(document.createTextNode(String()))

    ApplyStaticAttributes(element, node)

    for (const child of node.Children) {
      if (typeof child === 'object') {
        element.appendChild(Transform(child as VNode))
      } else {
        contents.push(child.toString())
      }
    }

    element.childNodes[0].nodeValue = contents.join(String())

    return element
  }

  if (typeof node.Type === 'function') {
    return Transform(node.Type({ Properties: node.Properties }))
  }

  throw new Error(`No such type as ${node.Type}`)
}