import { VNode } from "@/core/adapters/type.v-node"
import { GetDOMFrom, GetVNodeFrom, PatchDOM, PatchVNode } from "@/core/interpretator/dom/patch.dom"
import { Transform } from "@/core/interpretator/dom/transform/transform.dom"

import { DeepHydrate } from "@/core/interpretator/dom/hydrate/hydrate.dom"

import { BatchStatefulArrayOf } from "@/core/stateful/class.batch-stateful-array-of"
import { Stateful } from "@/core/stateful/class.stateful"
import { Scheduler } from "@/core/scheduler/class.scheduler"
import { ClearSubscriptions } from "@/core/interpretator/dom/subscriptions/dom.manager"

export class DOMListHydrator<T> {
  private _pool: HTMLElement[] = []
  private _template: HTMLElement | null = null

  private _flushing: boolean = false

  private _queues = {
    Add: new Set<{ Value: Stateful<T>[], Indexes: number[] }>(),
    Clear: new Set<{ Value: Stateful<T>[] }>(),
    Update: new Set<{ Value: Stateful<T>, Index: number }>(),
    Replace: new Set<{ Value: Stateful<T>[] }>(),
  }

  private PrepareHTMLTemplateFromCurrentVNode(): void {
    if (this._template == null) {
      this._template = Transform(this._farbic(this._items.Value[0], 0))
    }
  }

  private Swap(from_index: number, to_index: number): void {
    const list = this._items.Value
    const from = list[from_index]
    const to = list[to_index]

    const node = GetVNodeFrom(from)

    PatchVNode(from, GetVNodeFrom(to))
    PatchVNode(to, node)

    DeepHydrate(GetVNodeFrom(from), GetDOMFrom(from))
    DeepHydrate(GetVNodeFrom(to), GetDOMFrom(to))
  }

  private Remove(item: Stateful<T>): void {
    const dom = GetDOMFrom(item)

    dom.remove()
  }

  private Clear(items: Stateful<T>[]): void {
    for (const item of items) {
      this._pool.push(GetDOMFrom(item))
    }

    this._container.innerHTML = String()
  }

  private Replace(items: Stateful<T>[]): void {
    this.PrepareHTMLTemplateFromCurrentVNode()

    const children_count = this._container.children.length
    const data_count = items.length

    const common_count = Math.min(children_count, data_count)

    for (let index = 0; index < common_count; index++) {
      const existing_element = this._container.children[index] as HTMLElement
      const new_node = this._farbic(items[index], index + children_count)

      PatchDOM(items[index], existing_element)
      PatchVNode(items[index], new_node)
    }

    if (data_count > children_count) {
      const fragment = document.createDocumentFragment()

      for (let index = common_count; index < data_count; index++) {
        const element = this._pool.length > 0 ? this._pool.pop()! : this._template!.cloneNode(true) as HTMLElement
        const node = this._farbic(items[index], index + children_count)

        PatchDOM(items[index], element)
        PatchVNode(items[index], node)
        DeepHydrate(node, element)

        fragment.appendChild(element)
      }

      this._container.appendChild(fragment)
    }

    if (children_count > data_count) {
      while (this._container.children.length > data_count) {
        const last_element = this._container.lastElementChild as HTMLElement

        if (last_element) {
          ClearSubscriptions(last_element)

          this._pool.push(last_element)
          last_element.remove()
        }
      }
    }
  }

  private Add(items: Stateful<T>[]): void {
    this.PrepareHTMLTemplateFromCurrentVNode()

    const fragment = document.createDocumentFragment()
    const count = this._container.children.length

    for (let index = 0; index < items.length; index++) {
      const current_node = this._farbic(items[index], index + count)
      const current_element = this._template!.cloneNode(true) as HTMLElement

      PatchDOM(items[index], current_element)
      PatchDOM(current_node, current_element)

      PatchVNode(items[index], current_node)

      DeepHydrate(current_node, current_element)

      fragment.appendChild(current_element)
    }

    this._container.appendChild(fragment)
  }

  private Update(item: Stateful<T>, index: number): void {
    const element = GetDOMFrom(item)
    const node = this._farbic(item, index)

    DeepHydrate(node, element)
  }

  private Schedule() {
    if (this._flushing === false) {
      this._flushing = true

      Scheduler.Tick(() => {
        this.Flush()
        this._flushing = false
      })
    }
  }

  private Flush() {
    this._queues.Clear.forEach(event => this.Clear(event.Value))
    this._queues.Replace.forEach(event => this.Replace(event.Value))
    this._queues.Add.forEach(event => this.Add(event.Value))
    this._queues.Update.forEach(event => this.Update(event.Value, event.Index))

    this._queues.Clear.clear()
    this._queues.Add.clear()
    this._queues.Replace.clear()
    this._queues.Update.clear()
  }

  public constructor(
    private _items: BatchStatefulArrayOf<T>,
    private _farbic: (item: Stateful<T>, index: number) => VNode,
    private _container: HTMLElement) { }

  public Hydrate(): void {
    this._items.Added.Listen(event => {
      this._queues.Add.add(event)
      this.Schedule()
    })

    this._items.Swapped.Listen(event => {
      this.Swap(event.From, event.To)
    })

    this._items.Replaced.Listen(event => {
      this._queues.Replace.add(event)
      this._queues.Clear.clear()
      this.Schedule()
    })

    this._items.Cleared.Listen(event => {
      this._queues.Clear.add(event)
      this.Schedule()
    })

    this._items.Removed.Listen(event => {
      this.Remove(event.Value[0])
    })

    this._items.Updated.Listen(event => {
      this._queues.Update.add(event)
      this.Schedule()
    })
  }
}