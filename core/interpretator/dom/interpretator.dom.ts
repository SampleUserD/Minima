import { VNode } from "@/core/adapters/type.v-node"
import { Interpretator } from "@/core/interpretator/interface.interpretator"
import { BatchStatefulArrayOf } from "@/core/stateful/class.batch-stateful-array-of"
import { Stateful } from "@/core/stateful/class.stateful"

export class DOMInterpretator implements Interpretator {
  private _events: Set<string> = new Set()

  private PatchDOM(object: any, element: HTMLElement): void {
    object.dom = element
  }

  private GetDOMFrom(object: any): HTMLElement {
    return object.dom
  }

  private EnsureGlobalListener(name: string): void {
    if (this._events.has(name)) {
      return
    }

    this._events.add(name)

    this._root.addEventListener(name, (event: Event) => {
      let target = event.target as HTMLElement

      while (target && target !== this._root) {
        const listeners = (target as any).__listeners__

        if (listeners != undefined) {
          const callback = listeners.get(name)

          callback?.(event)

          if (event.cancelBubble) {
            break
          }
        }

        target = target.parentElement!
      }
    })
  }

  private ApplyEvents(node: VNode, element: HTMLElement): void {
    for (const [key, value] of Object.entries(node.Properties || {})) {
      if (key.startsWith('on') && typeof value === 'function') {
        const patch = element as any
        const name = key.slice(2).toLowerCase()

        if (patch.__listeners__ == undefined) {
          patch.__listeners__ = new Map<string, Function>()
        }

        patch.__listeners__.set(name, value)

        this.EnsureGlobalListener(name)
      }
    }
  }

  private ApplyAttributes(node: VNode, element: HTMLElement): void {
    for (const [key, value] of Object.entries(node.Properties || {})) {
      if (value instanceof Stateful == false) {
        element.setAttribute(key, value)
      }
    }
  }

  private HydrateAttributes(node: VNode, element: HTMLElement): void {
    for (const [key, value] of Object.entries(node.Properties || {})) {
      if (value instanceof Stateful) {
        value.Subscribe(value => {
          element.setAttribute(key, value)
        })
      }
    }
  }

  private HydrateTextContent(node: VNode, element: HTMLElement): void {
    const singular = node.Children.filter(r => r instanceof Stateful)

    const update = () => element.textContent = node.Children.map(r => r instanceof Stateful ? r.Get() : r).join(String())

    singular.forEach(r => {
      const stateful = r as Stateful<any>

      update()

      stateful.Subscribe(update)
    })
  }

  private HydrateList(node: VNode, element: HTMLElement): void {
    const each = node.Properties?.each as BatchStatefulArrayOf<any>
    const item = node.Properties?.item

    const list = each?.Get() || []

    const fragment = document.createDocumentFragment()

    let template: HTMLElement | null = null

    list.forEach((r: any, i) => {
      const tr = item(r, i)
      const element = this.Create(tr)

      this.PatchDOM(r, element)
      this.PatchDOM(tr, element)

      this.DeepHydrate(tr, element)

      fragment.appendChild(element)
    })

    element.appendChild(fragment)

    each?.Swapped.Listen(event => {
      const children = element.children
      const from = children[event.From] as HTMLElement
      const to = children[event.To] as HTMLElement

      this.DeepHydrate(node.Children[event.To] as VNode, from)
      this.DeepHydrate(node.Children[event.From] as VNode, to)

      const temporary = node.Children[event.To]

      node.Children[event.To] = node.Children[event.From]
      node.Children[event.From] = temporary
    })

    each?.Added.Listen(event => {
      const fragment = document.createDocumentFragment()
      const count = element.children.length

      if (template == null) {
        const first = item(event.Value[0], count)
        template = this.Create(first)
      }

      for (let index = 0; index < event.Value.length; index++) {
        const current_node = item(event.Value[index], index + count)
        const current_element = template.cloneNode(true) as HTMLElement

        node.Children.push(current_node)

        this.PatchDOM(event.Value[index], current_element)
        this.PatchDOM(current_node, current_element)
        this.DeepHydrate(current_node, current_element)

        fragment.appendChild(current_element)
      }

      element.appendChild(fragment)
    })

    each?.Removed.Listen(event => {
      const value = event.Value[0]
      const dom = this.GetDOMFrom(value)

      dom.remove()

      console.log('After remove, last 10 IDs:', Array.from(element.children).slice(-10).map(el => el.textContent));
    })

    each?.Cleared.Listen(event => {
      element.innerHTML = String()
      node.Children = []
    })
  }

  private Hydrate(node: VNode, element: HTMLElement): void {
    this.HydrateAttributes(node, element)
    this.HydrateTextContent(node, element)
    this.HydrateList(node, element)
  }

  private DeepHydrate(node: VNode, element: HTMLElement): void {
    this.Hydrate(node, element)
    this.ApplyEvents(node, element)

    for (let index = 0; index < node.Children.length; index++) {
      const child = node.Children[index] as VNode
      const possible_child = element.children[index] as HTMLElement

      if (typeof child !== 'object' || child instanceof Stateful) {
        continue
      }

      this.DeepHydrate(child, possible_child)
    }
  }

  private Create(node: VNode): HTMLElement {
    if (typeof node.Type === 'string') {
      const element = document.createElement(node.Type) as any
      const fragment = document.createDocumentFragment()
      const contents: string[] = []

      for (const child of node.Children) {
        if (typeof child === 'object') {
          if (child instanceof Stateful == false) {
            fragment.appendChild(this.Create(child as VNode))
          }
        } else {
          contents.push(child.toString())
        }
      }

      element.textContent = contents.join(String())

      this.Hydrate(node, element)
      this.ApplyEvents(node, element)
      this.ApplyAttributes(node, element)

      element.appendChild(fragment)

      return element
    }

    if (typeof node.Type === 'function') {
      return this.Create(node.Type({ Properties: node.Properties }))
    }

    throw new Error(`No such type as ${node.Type}`)
  }

  public constructor(private _root: HTMLElement) { }

  public Render(node: VNode): void {
    this._root.appendChild(this.Create(node))
  }

  public Delete(node: VNode): void { }
}