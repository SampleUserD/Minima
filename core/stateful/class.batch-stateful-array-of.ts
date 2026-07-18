import { BatchStateful } from "@/core/stateful/class.batch-stateful"
import { Stateful, StatefulSetter } from "@/core/stateful/class.stateful"
import { Signal } from "@/signals/signal.class"

export class BatchStatefulArrayOf<T> extends BatchStateful<Stateful<T>[]> {
  public readonly Added: Signal<{ Value: Stateful<T>[], Indexes: number[] }> = new Signal()
  public readonly Removed: Signal<{ Value: Stateful<T>[], Indexes: number[] }> = new Signal()
  public readonly Swapped: Signal<{ From: number, To: number }> = new Signal()
  public readonly Cleared: Signal<{ Value: Stateful<T>[] }> = new Signal()
  public readonly Updated: Signal<{ Value: Stateful<T>, Index: number }> = new Signal()
  public readonly Replaced: Signal<{ Value: Stateful<T>[] }> = new Signal()

  private ShallowReset(value: T, stateful: Stateful<T>): void {
    const is_object = typeof value !== 'object' || value === null

    if (is_object == false) {
      for (const key of Object.keys(value)) {
        const object = stateful.Value[key]

        if (value[key] instanceof Stateful == false) {
          continue
        }

        if (object instanceof Stateful) {
          object.Set(() => value[key].Get())
        } else {
          object[key] = value[key].Get()
        }
      }
    } else {
      stateful.Set(() => value)
    }
  }

  public constructor(value: T[]) {
    super([])

    this.Append(...value)
  }

  public Replace(...value: T[]): void {
    const array = this.Get()

    value.forEach((replace, index) => {
      if (array[index] !== undefined) {
        this.ShallowReset(replace, array[index])
      } else {
        array[index] = new Stateful<T>(replace)
      }
    })

    if (array.length > value.length) {
      array.length = value.length
    }

    this.Replaced.Emit({ Value: array })
  }

  public Append(...value: T[]): void {
    const array = this.Get()
    const indexes: number[] = []
    const values: Stateful<T>[] = []

    value.forEach(r => {
      const stateful = new Stateful<T>(r)
      const index = array.push(stateful)

      indexes.push(index)
      values.push(stateful)
    })

    this.Added.Emit({ Value: values, Indexes: indexes })
  }

  public Remove(index: number): void {
    const array = this.Get()
    const remove = array.splice(index, 1)!

    this.Removed.Emit({ Value: remove, Indexes: [index] })
  }

  public Update(index: number, setter: StatefulSetter<T>) {
    const array = this.Get()

    array[index].Set(setter)

    this.Updated.Emit({ Value: array[index], Index: index })
  }

  public Swap(a: number, b: number): void {
    const array = this.Get()
    const temporary = array[a]

    array[a] = array[b]
    array[b] = temporary

    this.Swapped.Emit({ From: a, To: b })
  }

  public Clear(): void {
    const value = this.Value

    this.Set(() => [])

    this.Cleared.Emit({ Value: value })
  }

  public Pop(): Stateful<T> {
    const array = this.Get()
    const stateful = array.pop()

    this.Notify()

    return stateful!
  }

  public At(index: number): Stateful<T> {
    const array = this.Get()

    return array[index]
  }

  public Dispose(): void {
    super.Dispose()
    this.Added.Clear()
    this.Removed.Clear()
    this.Swapped.Clear()
    this.Cleared.Clear()
    this.Replaced.Clear()
  }

  public get Length(): number {
    return this.Get().length
  }
}