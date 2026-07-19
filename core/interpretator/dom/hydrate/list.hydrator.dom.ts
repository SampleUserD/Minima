import { VNode } from "@/core/adapters/type.v-node"
import { GetDOMFrom, GetVNodeFrom, PatchDOM, PatchVNode } from "@/core/interpretator/dom/patch.dom"
import { Transform } from "@/core/interpretator/dom/transform/transform.dom"

import { BatchStatefulArrayOf } from "@/core/stateful/class.stateful-array-of"
import { Stateful } from "@/core/stateful/class.stateful"
import { Scheduler } from "@/core/scheduler/class.scheduler"
import { ClearSubscriptions } from "@/core/interpretator/dom/subscriptions/dom.manager"
import { AbstractStateful } from "@/core/stateful/abstract.stateful"
import { StatefulDependentOf } from "@/core/stateful/class.dependent-of"
import { Analyze, Apply, KindToInstructionMap } from "@/core/interpretator/dom/analyzer/class.analyzer"

export class DOMListHydrator<T> {
  private _pool: HTMLElement[] = []

  private _template: HTMLElement | null = null
  private _template_vnode: VNode | null = null
  private _template_analysis: KindToInstructionMap | null = null

  private _selection: AbstractStateful<T>[] = []

  private _increment = (value: number) => value + 1
  private _clear = () => 0

  private _counter: AbstractStateful<number> = new Stateful(0)

  private _flushing: boolean = false

  private _queues = {
    Add: new Set<{ Value: AbstractStateful<T>[], Indexes: number[] }>(),
    Clear: new Set<{ Value: AbstractStateful<T>[] }>(),
    Update: new Set<{ Value: AbstractStateful<T>, Index: number }>(),
    Replace: new Set<{ Value: AbstractStateful<T>[] }>(),
  }

  private PrepareHTMLTemplateFromCurrentVNode(): void {
    if (this._template == null || this._template_vnode == null || this._template_analysis == null) {
      const row = new StatefulDependentOf(this._counter, index => this._items.Value[index].Value)
      const index = new StatefulDependentOf(this._counter, index => index)

      this._template_vnode = this._farbic(row, index)
      this._template = Transform(this._template_vnode!)
      this._template_analysis = Analyze(this._template_vnode)
    }
  }

  private Swap(from_index: number, to_index: number): void {
    const children = this._container.children

    this._container.insertBefore(children[to_index], children[from_index + 1])
    this._container.insertBefore(children[from_index], children[to_index + 1])
  }

  private Remove(item: AbstractStateful<T>): void {
    const dom = GetDOMFrom(item)

    dom.remove()
  }

  private Clear(items: AbstractStateful<T>[]): void {
    for (const item of items) {
      this._pool.push(GetDOMFrom(item))
    }

    this._container.innerHTML = String()
    this._counter.Set(this._clear)
  }

  private Replace(items: AbstractStateful<T>[]): void {
    this.PrepareHTMLTemplateFromCurrentVNode()

    const children_count = this._container.children.length
    const data_count = items.length

    const common_count = Math.min(children_count, data_count)

    this._counter.Set(this._clear)

    for (let index = 0; index < common_count; index++) {
      Apply(this._container.children[index] as HTMLElement, this._template_analysis!)

      this._counter.Set(this._increment)
    }

    if (data_count > children_count) {
      const fragment = document.createDocumentFragment()

      for (let index = common_count; index < data_count; index++) {
        const element = this._pool.length > 0 ? this._pool.pop()! : this._template!.cloneNode(true) as HTMLElement
        const node = this._template_vnode!

        PatchDOM(items[index], element)
        PatchVNode(items[index], node)

        Apply(element as HTMLElement, this._template_analysis!)

        fragment.appendChild(element)

        this._counter.Set(this._increment)
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

  private Add(items: AbstractStateful<T>[]): void {
    this.PrepareHTMLTemplateFromCurrentVNode()

    const fragment = document.createDocumentFragment()

    this._counter.Set(() => this._items.Length - items.length)

    for (let index = 0; index < items.length; index++) {
      const current_node = this._template_vnode!
      const current_element = this._template!.cloneNode(true) as HTMLElement

      PatchDOM(items[index], current_element)
      PatchDOM(current_node, current_element)

      PatchVNode(items[index], current_node)

      Apply(current_element, this._template_analysis!)

      fragment.appendChild(current_element)

      this._counter.Set(this._increment)
    }

    this._container.appendChild(fragment)
  }

  private Select(items: AbstractStateful<T>[]): void {
    this._selection.forEach(item => {
      const node = GetVNodeFrom(item)
      const dom = GetDOMFrom(item)

      const unselect = node.Properties['m-unselect']

      if (unselect !== undefined) {
        unselect(dom)
      }
    })

    items.forEach(item => {
      const node = GetVNodeFrom(item)
      const dom = GetDOMFrom(item)

      const select = node.Properties['m-select']

      if (select !== undefined) {
        select(dom)
      }
    })

    this._selection = items
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

    this._queues.Clear.clear()
    this._queues.Add.clear()
    this._queues.Replace.clear()
  }

  public constructor(
    private _items: BatchStatefulArrayOf<T>,
    private _farbic: (item: AbstractStateful<T>, index: AbstractStateful<number>) => VNode,
    private _container: HTMLElement) { }

  public Hydrate(): void {
    this._items.Selected.Listen(event => {
      this.Select(event.Value)
    })

    this._items.Added.Listen(event => {
      this._queues.Add.add(event)
      this.Schedule()
    })

    this._items.Swapped.Listen(event => {
      this.Swap(event.From, event.To)
    })

    this._items.Replaced.Listen(event => {
      this._queues.Clear.clear()
      this._queues.Replace.clear()

      this._queues.Replace.add(event)
      this.Schedule()
    })

    this._items.Cleared.Listen(event => {
      this._queues.Clear.add(event)
      this.Schedule()
    })

    this._items.Removed.Listen(event => {
      this.Remove(event.Value[0])
    })
  }
}