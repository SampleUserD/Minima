import { VNode } from "@/core/adapters/type.v-node"

export function PatchDOM(object: any, element: HTMLElement): void {
  object.dom = element
}

export function GetDOMFrom(object: any): HTMLElement {
  return object.dom
}

export function PatchVNode(object: any, node: VNode): void {
  object.vnode = node
}

export function GetVNodeFrom(object: any): VNode {
  return object.vnode
}

