import { VNode } from "@/core/adapters/type.v-node"
import { Interpretator } from "@/core/interpretator/interface.interpretator"
import { BatchStatefulArrayOf } from "@/core/stateful/class.batch-stateful-array-of"
import { Stateful } from "@/core/stateful/class.stateful"

export class DOMInterpretator implements Interpretator {
  private _nodes: WeakMap<VNode, HTMLElement> = new WeakMap()
  private _events: Set<string> = new Set()

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
    let children = Array.from(element.children)

    const each = node.Properties?.each as BatchStatefulArrayOf<any>
    const item = node.Properties?.item

    let list = each?.Get() || []

    const items = list.map((r, i) => item(r, i))
    const fragment = document.createDocumentFragment()

    items.forEach(item => {
      const element = this.Create(item)

      this.DeepHydrate(item, element)

      fragment.appendChild(element)
      children.push(element)
    })

    element.appendChild(fragment)

    each?.Swapped.Listen(event => {
      const from = element.children[event.From]
      const to = element.children[event.To]

      const placeholder = document.createElement('swap-placeholder')

      const temporary = children[event.To]

      children[event.To] = children[event.From] as Element
      children[event.From] = temporary as Element

      if (event.From < event.To) {
        element.insertBefore(placeholder, from)
        element.insertBefore(from, to)
        element.insertBefore(to, placeholder)

        element.removeChild(placeholder)
      } else {
        element.insertBefore(placeholder, to)
        element.insertBefore(to, from)
        element.insertBefore(from, placeholder)

        element.removeChild(placeholder)
      }
    })

    each?.Added.Listen(event => {
      const fragment = document.createDocumentFragment()

      event.Value.forEach((value, index) => {
        const node = item(value, index)
        const child = this.Create(node)

        fragment.appendChild(child)

        children.push(child)

        this.DeepHydrate(node, child)
      })

      element.appendChild(fragment)
    })

    each?.Removed.Listen(event => {
      event.Indexes.forEach(index => {
        const child = children[index] as any

        children.splice(index, 1)

        this.Delete(child.minima)
      })
    })

    each?.Cleared.Listen(event => {
      for (const child of children) {
        this.Delete((child as any).minima)
      }

      children = []
    })
  }

  private Hydrate(node: VNode, element: HTMLElement): void {
    this.HydrateAttributes(node, element)
    this.HydrateTextContent(node, element)
    this.HydrateList(node, element)
  }

  private DeepHydrate(node: VNode, element: HTMLElement): void {
    this.Hydrate(node, element)

    for (const child of node.Children) {
      if (typeof child !== 'object' || child instanceof Stateful) {
        continue
      }

      this.Hydrate(child as VNode, this._nodes.get(child as VNode)!)
    }
  }

  private Create(node: VNode): HTMLElement {
    if (typeof node.Type === 'string') {
      const element = document.createElement(node.Type) as any
      const fragment = document.createDocumentFragment()

      element.minima = node

      this._nodes.set(node, element)
      this.Hydrate(node, element)
      this.ApplyEvents(node, element)
      this.ApplyAttributes(node, element)

      for (const child of node.Children) {
        if (typeof child === 'object') {
          if (child instanceof Stateful == false) {
            fragment.appendChild(this.Create(child as VNode))
          }
        } else {
          const text = document.createTextNode(child.toString())

          fragment.appendChild(text)
        }
      }

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

  public Delete(node: VNode): void {
    this._nodes.get(node)?.remove()
    this._nodes.delete(node)
  }
}