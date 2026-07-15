import { VNode } from "@/core/adapters/type.v-node"

export abstract class Interpretator {
  public abstract Render(node: VNode): void
  public abstract Delete(node: VNode): void
}