import { Stateful } from "@/core/stateful/class.stateful"

export type Component = (props: { Properties: VNodeProperties }) => VNode

export type VNodeType = string | Component
export type VNodeProperties = Record<string, any>
export type VNodeChild = VNode | string | number

export type VNode = {
  Type: VNodeType,
  Properties: VNodeProperties,
  Children: VNodeChild[]
}
