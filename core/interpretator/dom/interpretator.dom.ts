import { VNode } from "@/core/adapters/type.v-node"
import { Interpretator } from "@/core/interpretator/interface.interpretator"
import { Scheduler } from "@/core/scheduler/class.scheduler"
import { BatchStatefulArrayOf } from "@/core/stateful/class.batch-stateful-array-of"
import { Stateful } from "@/core/stateful/class.stateful"

export class DOMInterpretator implements Interpretator {
  private _events: Set<string> = new Set()

  private IsSpecialAttribute(key: string): boolean {
    return key.startsWith('fn-') || key.startsWith('bind-') || key === 'each' || key === 'item'
  }

  private PatchDOM(object: any, element: HTMLElement): void {
    object.dom = element
  }

  private GetDOMFrom(object: any): HTMLElement {
    return object.dom
  }

  private PatchVNode(object: any, node: VNode): void {
    object.vnode = node
  }

  private GetVNodeFrom(object: any): VNode {
    return object.vnode
  }

  private CreateUnsubscriberMap(element: HTMLElement) {
    const patch = element as any

    if (patch.unsubscribers == undefined) {
      patch.unsubscribers = new Set<() => void>()
    }
  }

  private RegisterUnsubscriber(element: HTMLElement, callback: () => void) {
    const patch = element as any

    patch.unsubscribers.add(callback)
  }

  private Unsubscribe(element: HTMLElement): void {
    const patch = element as any

    patch.unsubscribers.forEach(callback => callback())
    patch.unsubscribers.clear()
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
      if (this.IsSpecialAttribute(key) == false && value instanceof Stateful == false) {
        element.setAttribute(key, value)
      }
    }
  }

  private HydrateBindAttributes(node: VNode, element: HTMLElement): void {
    for (const [key, value] of Object.entries(node.Properties || {})) {
      if (key.startsWith('bind-')) {
        const name = key.slice(5)

        const unsubscribe = value.Subscribe(value => {
          element.setAttribute(name, value)
        })

        this.RegisterUnsubscriber(element, unsubscribe)
      }
    }
  }

  private HydrateFnAttributes(node: VNode, element: HTMLElement): void {
    for (const [key, value] of Object.entries(node.Properties || {})) {
      if (key.startsWith('fn-deps-')) {
        continue
      }

      if (key.startsWith('fn-')) {
        const name = key.slice(3)
        const dependencies = node.Properties[`fn-deps-${name}`] || []

        const update = () => element.setAttribute(name, value())

        update()

        dependencies.forEach(dependency => {
          const unsubscribe = dependency.Subscribe(update)
          this.RegisterUnsubscriber(element, unsubscribe)
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

      const unsubscribe = stateful.Subscribe(update)

      this.RegisterUnsubscriber(element, unsubscribe)
    })
  }

  private HydrateList_Update(container: HTMLElement, items: Stateful<any>[], fabric: any, pool: HTMLElement[], template: HTMLElement): void {
    const children_count = container.children.length
    const data_count = items.length

    const common_count = Math.min(children_count, data_count)

    for (let index = 0; index < common_count; index++) {
      const existing_element = container.children[index] as HTMLElement

      this.Unsubscribe(existing_element)
      this.PatchDOM(items[index], existing_element)
      this.DeepHydrate(fabric(items[index], index + children_count), existing_element)
    }

    if (data_count > children_count) {
      const fragment = document.createDocumentFragment()

      for (let index = common_count; index < data_count; index++) {
        const element = pool.length > 0 ? pool.pop()! : template.cloneNode(true) as HTMLElement

        this.PatchDOM(items[index], element)
        this.DeepHydrate(fabric(items[index], index + children_count), element)

        fragment.appendChild(element)
      }

      container.appendChild(fragment)
    }

    if (children_count > data_count) {
      while (container.children.length > data_count) {
        const last_element = container.lastElementChild as HTMLElement

        if (last_element) {
          this.Unsubscribe(last_element)

          pool.push(last_element)
          last_element.remove()
        }
      }
    }
  }

  private HydrateList(node: VNode, element: HTMLElement): void {
    const each = node.Properties?.each as BatchStatefulArrayOf<any>
    const item = node.Properties?.item

    const list = each?.Get() || []
    const pool: HTMLElement[] = []

    const fragment = document.createDocumentFragment()

    let template: HTMLElement | null = null
    let maximal_seen_elements: number = 0
    let is_pending_clear: boolean = false

    list.forEach((r: any, i) => {
      const tr = item(r, i)
      const element = this.Create(tr)

      this.PatchDOM(r, element)
      this.PatchDOM(tr, element)
      this.PatchVNode(r, tr)

      this.DeepHydrate(tr, element)

      fragment.appendChild(element)
    })

    element.appendChild(fragment)

    each?.Swapped.Listen(event => {
      const list = each?.Get()
      const from = list[event.From]
      const to = list[event.To]

      const node = this.GetVNodeFrom(from)

      this.PatchVNode(from, this.GetVNodeFrom(to))
      this.PatchVNode(to, node)

      this.DeepHydrate(this.GetVNodeFrom(from), this.GetDOMFrom(from))
      this.DeepHydrate(this.GetVNodeFrom(to), this.GetDOMFrom(to))
    })

    each?.Added.Listen(event => {
      const fragment = document.createDocumentFragment()
      const count = element.children.length

      maximal_seen_elements = Math.max(maximal_seen_elements, event.Value.length)

      if (template == null) {
        const first = item(event.Value[0], count)
        template = this.Create(first)
      }

      for (let index = 0; index < event.Value.length; index++) {
        const current_node = item(event.Value[index], index + count)
        const current_element = template.cloneNode(true) as HTMLElement

        this.PatchDOM(event.Value[index], current_element)
        this.PatchDOM(current_node, current_element)
        this.PatchVNode(event.Value[index], current_node)
        this.DeepHydrate(current_node, current_element)

        fragment.appendChild(current_element)
      }

      element.appendChild(fragment)
    })

    each?.Replaced.Listen(event => {
      if (template == null) {
        const first = item(event.Value[0], element.children.length)
        template = this.Create(first)
      }

      this.HydrateList_Update(element, event.Value, item, pool, template)

      is_pending_clear = false
    })

    each?.Removed.Listen(event => {
      const value = event.Value[0]
      const dom = this.GetDOMFrom(value)

      dom.remove()
    })

    each?.Cleared.Listen(event => {
      is_pending_clear = true

      Scheduler.Tick(() => {
        if (is_pending_clear) {
          element.innerHTML = String()
          is_pending_clear = false
        }
      })
    })
  }

  private Hydrate(node: VNode, element: HTMLElement): void {
    this.CreateUnsubscriberMap(element)
    this.HydrateFnAttributes(node, element)
    this.HydrateBindAttributes(node, element)
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