import { VNode, VNodeChild, VNodeProperties, VNodeType } from "@/core/adapters/type.v-node"

export function jsx(type: VNodeType, properties: VNodeProperties, ...children: VNodeChild[]): VNode {
  return {
    Type: type,
    Properties: properties,
    Children: children
  }
}

export function jsxs(type: VNodeType, properties: VNodeProperties, ...children: VNodeChild[]): VNode {
  return {
    Type: type,
    Properties: properties,
    Children: children
  }
}