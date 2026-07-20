import { VNode } from "@/core/adapters/type.v-node"

export type Template = {
  Node: VNode,
  Element: HTMLElement
}

export function Clone(template: Template): Template {
  return {
    Node: template.Node,
    Element: template.Element.cloneNode(true) as HTMLElement
  }
}

export function Release(template: Template): void {
  if (template.Element.isConnected) {
    template.Element.remove()
  }
}