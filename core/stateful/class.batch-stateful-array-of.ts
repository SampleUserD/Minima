import { BatchStateful } from "@/core/stateful/class.batch-stateful"
import { Stateful, StatefulSetter } from "@/core/stateful/class.stateful"
import { Signal } from "@/signals/signal.class"

export class BatchStatefulArrayOf<T> extends BatchStateful<Stateful<T>[]> {
  private _removes: number = 0

  public readonly Added: Signal<{ Value: Stateful<T>[], Indexes: number[] }> = new Signal()
  public readonly Removed: Signal<{ Value: Stateful<T>[], Indexes: number[] }> = new Signal()
  public readonly Swapped: Signal<{ From: number, To: number }> = new Signal()
  public readonly Cleared: Signal<boolean> = new Signal()

  public constructor(value: T[]) {
    super([])

    this.Append(...value)
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

    this.Removed.Emit({ Value: remove, Indexes: [index - this._removes] })

    this._removes++
  }

  public Update(index: number, setter: StatefulSetter<T>) {
    const array = this.Get()

    array[index].Set(setter)
  }

  public Swap(a: number, b: number): void {
    const array = this.Get()
    const temporary = array[a]

    array[a] = array[b]
    array[b] = temporary

    this.Swapped.Emit({ From: a, To: b })
  }

  public Clear(): void {
    this.Set(() => [])

    this.Cleared.Emit(true)

    this._removes = 0
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
  }

  public get Length(): number {
    return this.Get().length
  }
}