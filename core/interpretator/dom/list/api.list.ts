import { VNode } from "@/core/adapters/type.v-node"
import { Analyze } from "@/core/interpretator/dom/analyzer/api.analyze"
import { AnalyzisResult } from "@/core/interpretator/dom/analyzer/type.analyze"
import { Apply } from "@/core/interpretator/dom/applier/api.applier"
import { Transform } from "@/core/interpretator/dom/transform/api.transform"
import { Pool } from "@/core/pool/class.pool"
import { Scheduler } from "@/core/scheduler/class.scheduler"
import { Abstract, ArrayOf, DependentOf } from "@/core/state"
import { Version } from "@/core/state/abstract.version"
import { State } from "@/core/state/class.state"
import { Trigger } from "@/core/trigger/class.trigger"

type Fabric<T> = (row: Abstract<T>, index: Abstract<number>) => VNode

export class ListOrchestrator<T> {
  private _map: Map<T, HTMLElement> = new Map()

  private _pool!: Pool<HTMLElement>
  private _templateDOM!: HTMLElement
  private _templateVN!: VNode
  private _templateInstructions!: AnalyzisResult

  private _index: State<number> = new State(0)
  private _versions: Version[] = []

  private _flushing: boolean = false
  private _selection: Map<number, T> = new Map()

  private _queues = {
    Add: new Set<T[]>(),
    Clear: new Set<T[]>(),
    Update: new Map<number, T>(),
    Replace: new Set<T[]>(),
    Swap: new Set<{ From: number, To: number }>(),
    Select: new Set<number>()
  }

  public constructor(
    private _container: HTMLElement,
    private _items: ArrayOf<T>,
    private _fabric: Fabric<T>) {
    this.Prepare()
    this.Connect()
  }

  private Prepare() {
    const row = new DependentOf(this._index, value => this._items.Value[value])
    const index = new DependentOf(this._index, value => value)

    this._templateVN = this._fabric(row, index)
    this._templateDOM = Transform(this._templateVN)
    this._templateInstructions = Analyze(this._templateVN)

    this._pool = new Pool<HTMLElement>(
      () => this._templateDOM.cloneNode(true) as HTMLElement
    )
  }

  private Replace(items: T[]) {
    const children_count = this._container.children.length
    const data_count = items.length

    const common_count = Math.min(children_count, data_count)

    this._map.clear()

    for (let index = 0; index < common_count; index++) {
      this._index.Set(index)

      Apply(this._container.children[index] as HTMLElement, this._templateInstructions)
    }

    if (data_count > children_count) {
      const fragment = document.createDocumentFragment()

      for (let index = common_count; index < data_count; index++) {
        this._index.Set(index)

        const element = this._pool.Acquire()

        Apply(element, this._templateInstructions)

        this._map.set(items[index], element)

        fragment.appendChild(element)
      }

      this._container.appendChild(fragment)
    }

    if (children_count > data_count) {
      while (this._container.children.length > data_count) {
        const last_element = this._container.lastElementChild as HTMLElement

        if (last_element) {
          this._pool.Release(last_element)
        }
      }
    }
  }

  private Clear(items: T[]) {
    for (const item of items) {
      this._pool.Release(this._map.get(item)!)
    }

    this._container.innerHTML = String()
    this._index.Set(0)
  }

  private Swap(from_index: number, to_index: number) {
    this._index.Set(to_index)
    Apply(this._container.children[from_index] as HTMLElement, this._templateInstructions)

    this._index.Set(from_index)
    Apply(this._container.children[to_index] as HTMLElement, this._templateInstructions)
  }

  private Update(item: T, index: number) {
    const dom = this._map.get(item)!

    this._index.Set(index)

    Apply(dom, this._templateInstructions)
  }

  private Remove(item: T): void {
    const dom = this._map.get(item)!

    dom.remove()
  }

  private Select(index: number) {
    const item = this._items.Value[index]
    const node = this._templateVN
    const unselect = node.Properties['m-unselect']
    const select = node.Properties['m-select']

    if (unselect === undefined || select === undefined) {
      return
    }

    this._selection.forEach(item => unselect(this._map.get(item)))

    select(this._map.get(item))

    this._selection.set(index, item)
  }

  private Append(data: T[]) {
    const fragment = document.createDocumentFragment()

    for (let index = 0; index < data.length; index++) {
      this._index.Set(this._items.Length - data.length + index)

      const element = this._pool.Acquire()

      Apply(element, this._templateInstructions)

      this._map.set(data[index], element)

      fragment.appendChild(element)
    }

    this._container.appendChild(fragment)
  }

  private Flush() {
    this._queues.Clear.forEach(event => this.Clear(event))
    this._queues.Replace.forEach(event => this.Replace(event))
    this._queues.Add.forEach(event => this.Append(event))
    this._queues.Swap.forEach(event => this.Swap(event.From, event.To))
    this._queues.Update.forEach((event, index) => this.Update(event, index))
    this._queues.Select.forEach(event => this.Select(event))

    this._queues.Add.clear()
    this._queues.Clear.clear()
    this._queues.Replace.clear()
    this._queues.Select.clear()
    this._queues.Swap.clear()
    this._queues.Update.clear()
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

  private Connect() {
    this._items.Selected.Listen(event => {
      this._queues.Select.add(event)
      this.Schedule()
    })

    this._items.Appended.Listen(event => {
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
      this._queues.Clear.clear()
      this._queues.Clear.add(event)
      this.Schedule()
    })

    this._items.Removed.Listen(event => {
      this.Remove(event.Value)
    })

    this._items.Updated.Listen(event => {
      this._queues.Update.set(event.Index, event.Value)
      this.Schedule()
    })
  }
}