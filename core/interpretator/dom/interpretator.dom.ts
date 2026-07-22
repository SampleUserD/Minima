import { VNode } from "@/core/adapters/type.v-node"
import { Analyze } from "@/core/interpretator/dom/analyzer/api.analyze"
import { Apply } from "@/core/interpretator/dom/applier/api.applier"
import { Transform } from "@/core/interpretator/dom/transform/api.transform"
import { Interpretator } from "@/core/interpretator/interface.interpretator"

export class DOMInterpretator extends Interpretator {
  public constructor(private _container: HTMLElement) {
    super()
  }

  public Render(node: VNode): void {
    const instructions = Analyze(node)
    const element = Transform(node)

    Apply(element, instructions)

    this._container.appendChild(element)
  }

  public Delete(node: VNode): void {
    this._container.innerHTML = String()
  }
}