import { VNode } from "@/core/adapters/type.v-node"
import { DeepHydrate } from "@/core/interpretator/dom/hydrate/hydrate.dom"
import { Transform } from "@/core/interpretator/dom/transform/transform.dom"
import { Interpretator } from "@/core/interpretator/interface.interpretator"

export class DOMInterpretator implements Interpretator {
  public constructor(private _root: HTMLElement) { }

  public Render(node: VNode): void {
    const element = Transform(node)

    DeepHydrate(node, element)

    this._root.appendChild(element)
  }

  public Delete(node: VNode): void {
    this._root.innerHTML = String()
  }
}