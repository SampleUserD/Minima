import { VNode } from "@/core/adapters/type.v-node"
import { GetDOMFrom, GetVNodeFrom, PatchDOM, PatchIndex, PatchVNode } from "@/core/interpretator/dom/patch.dom"
import { Transform } from "@/core/interpretator/dom/transform/transform.dom"

import { BatchStatefulArrayOf } from "@/core/stateful/class.stateful-array-of"
import { Stateful } from "@/core/stateful/class.stateful"
import { Scheduler } from "@/core/scheduler/class.scheduler"
import { ClearSubscriptions } from "@/core/interpretator/dom/subscriptions/dom.manager"
import { AbstractStateful } from "@/core/stateful/abstract.stateful"
import { StatefulDependentOf } from "@/core/stateful/class.dependent-of"
import { Template } from "@/core/interpretator/dom/hydrate/cache/types.template"
import { WriteAnalyzeForIn } from "@/core/interpretator/dom/hydrate/analyzer/class.analyzer"
import { ApplyFor } from "@/core/interpretator/dom/hydrate/applier/class.applier"
import { Pool } from "@/core/interpretator/dom/hydrate/cache/class.pool"
import { Query } from "@/core/interpretator/dom/hydrate/cache/class.query"

export class DOMListHydrator<T> {
  private _pool: Pool | null = null
  private _template: Template | null = null

  private _query: Query = new Query()
  private _templateQuery: Query = new Query()

  private _selection: Map<number, AbstractStateful<T>> = new Map()
  private _counter: AbstractStateful<number> = new Stateful(0)

  private _flushing: boolean = false
  private _queues = {
    Add: new Set<{ Value: AbstractStateful<T>[], Indexes: number[] }>(),
    Clear: new Set<{ Value: AbstractStateful<T>[] }>(),
    Update: new Map<number, AbstractStateful<T>>(),
    Replace: new Set<{ Value: AbstractStateful<T>[] }>(),
    Swap: new Set<{ From: number, To: number }>(),
    Select: new Map<number, AbstractStateful<T>>()
  }

  private BatchUpdateFrom(index: number, container: HTMLElement | DocumentFragment) {
    this._counter.DirectSet(index - 1)
    const elements = this._query.Query('[data-mi]', container)
    const batch_size = this._templateQuery.Query('[data-mi]', this._template.Element).length

    let current_index = 0

    for (const node of elements) {
      this._counter.DirectSet(Math.floor(current_index / batch_size))

      ApplyFor(node)

      current_index++
    }
  }

  private PrepareHTMLTemplateFromCurrentVNode(): void {
    if (this._template == null) {
      const row = new StatefulDependentOf(this._counter, index => this._items.Value[index].Value)
      const index = new StatefulDependentOf(this._counter, index => index)

      const node = this._farbic(row, index)
      const element = Transform(node)

      this._template = {
        Node: node,
        Element: element
      }

      this._pool = new Pool(this._template)

      WriteAnalyzeForIn(node)

      this._templateQuery.Query('[data-mi]', element)
    }
  }

  private Swap(from_index: number, to_index: number): void {
    const previous = this._counter.Value

    this._counter.DirectSet(to_index)
    ApplyFor(this._container.children[from_index] as HTMLElement)

    this._counter.DirectSet(from_index)
    ApplyFor(this._container.children[to_index] as HTMLElement)

    this._counter.DirectSet(previous)
  }

  private Remove(item: AbstractStateful<T>): void {
    const dom = GetDOMFrom(item)

    dom.remove()
  }

  private Clear(items: AbstractStateful<T>[]): void {
    for (const item of items) {
      this._pool.Push({
        Node: this._template.Node,
        Element: GetDOMFrom(item)
      })
    }

    this._container.innerHTML = String()
    this._counter.DirectSet(0)
  }

  private Replace(items: AbstractStateful<T>[]): void {
    this.PrepareHTMLTemplateFromCurrentVNode()

    const children_count = this._container.children.length
    const data_count = items.length

    const common_count = Math.min(children_count, data_count)

    if (data_count > children_count) {
      const fragment = document.createDocumentFragment()

      for (let index = common_count; index < data_count; index++) {
        const template = this._pool.Get()

        PatchDOM(items[index], template.Element)
        PatchVNode(items[index], template.Node)
        PatchIndex(template.Element, index)

        fragment.appendChild(template.Element)
      }

      this.BatchUpdateFrom(0, fragment)

      this._container.appendChild(fragment)
    }

    if (children_count > data_count) {
      while (this._container.children.length > data_count) {
        const last_element = this._container.lastElementChild as HTMLElement

        if (last_element) {
          ClearSubscriptions(last_element)

          this._pool.Push({
            Node: this._template.Node,
            Element: last_element
          })

          last_element.remove()
        }
      }
    }

    this._container.style.visibility = 'hidden'

    this._query.Invalidate('[data-mi]')
    this.BatchUpdateFrom(0, this._container)

    this._container.style.visibility = 'visible'
  }

  private Add(items: AbstractStateful<T>[]): void {
    this.PrepareHTMLTemplateFromCurrentVNode()

    const fragment = document.createDocumentFragment()

    for (let index = 0; index < items.length; index++) {
      const current_node = this._template.Node
      const current_element = this._pool.Get()

      PatchDOM(items[index], current_element.Element)
      PatchDOM(current_node, current_element.Element)

      PatchVNode(items[index], current_node)
      PatchIndex(current_element, index)

      fragment.appendChild(current_element.Element)
    }

    this._query.Invalidate('[data-mi]')

    this.BatchUpdateFrom(this._items.Length - items.length, fragment)

    this._container.appendChild(fragment)
  }

  private Select(item: AbstractStateful<T>, index: number): void {
    this._selection.forEach(item => {
      const node = GetVNodeFrom(item)
      const dom = GetDOMFrom(item)

      const unselect = node.Properties['m-unselect']

      if (unselect !== undefined) {
        unselect(dom)
      }
    })

    const node = GetVNodeFrom(item)
    const dom = GetDOMFrom(item)

    const select = node.Properties['m-select']

    if (select !== undefined) {
      select(dom)
    }

    this._selection.set(index, item)
  }

  private Update(item: AbstractStateful<T>, index: number): void {
    const dom = GetDOMFrom(item)

    this._counter.DirectSet(index)

    ApplyFor(dom)
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
    this._queues.Swap.forEach(event => this.Swap(event.From, event.To))
    this._queues.Update.forEach((event, index) => this.Update(event, index))
    this._queues.Select.forEach((event, index) => this.Select(event, index))

    this._queues.Select.clear()
    this._queues.Clear.clear()
    this._queues.Add.clear()
    this._queues.Replace.clear()
    this._queues.Swap.clear()
    this._queues.Update.clear()
  }

  public constructor(
    private _items: BatchStatefulArrayOf<T>,
    private _farbic: (item: AbstractStateful<T>, index: AbstractStateful<number>) => VNode,
    private _container: HTMLElement) { }

  public Hydrate(): void {
    this._items.Selected.Listen(event => {
      this._queues.Select.set(event.Indexes[0], event.Value[0])
      this.Schedule()
    })

    this._items.Added.Listen(event => {
      this._queues.Add.add(event)
      this.Schedule()
    })

    this._items.Swapped.Listen(event => {
      this._queues.Swap.add(event)
      this.Schedule()
    })

    this._items.Replaced.Listen(event => {
      this._queues.Clear.clear()
      this._queues.Replace.clear()
      this._queues.Swap.clear()
      this._queues.Update.clear()
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

    this._items.Updated.Listen(event => {
      this._queues.Update.set(event.Index, event.Value)
      this.Schedule()
    })
  }
}