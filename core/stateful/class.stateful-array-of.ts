import { Stateful, StatefulSetter } from "@/core/stateful/class.stateful"
import { Signal } from "@/signals/signal.class"
import { AbstractStateful } from "@/core/stateful/abstract.stateful"

export class BatchStatefulArrayOf<T, U extends AbstractStateful<T> = AbstractStateful<T>> implements AbstractStateful<U[]> {
  private _version: number = 0
  private _value: U[] = []

  public readonly Added: Signal<{ Value: AbstractStateful<T>[], Indexes: number[] }> = new Signal()
  public readonly Removed: Signal<{ Value: AbstractStateful<T>[], Indexes: number[] }> = new Signal()
  public readonly Swapped: Signal<{ From: number, To: number }> = new Signal()
  public readonly Cleared: Signal<{ Value: AbstractStateful<T>[] }> = new Signal()
  public readonly Updated: Signal<{ Value: AbstractStateful<T>, Index: number }> = new Signal()
  public readonly Replaced: Signal<{ Value: AbstractStateful<T>[] }> = new Signal()
  public readonly Selected: Signal<{ Value: AbstractStateful<T>[], Indexes: number[] }> = new Signal()

  public constructor(value: T[], private _fabric: (item: T) => U) {
    this.Append(...value)
  }

  public Get(): U[] {
    return this._value
  }

  public Set(value: (value: U[]) => U[]): void {
    this._value = value(this._value)
  }

  public Replace(...value: T[]): void {
    const array = this.Get()

    value.forEach((replace, index) => {
      if (array[index] !== undefined) {
        array[index].Set(() => replace)
      } else {
        array[index] = this._fabric(replace)
      }
    })

    if (array.length > value.length) {
      array.length = value.length
    }

    this.Replaced.Emit({ Value: array })

    this._version++
  }

  public Append(...value: T[]): void {
    const array = this.Get()
    const indexes: number[] = []
    const values: AbstractStateful<T>[] = []

    value.forEach(r => {
      const stateful = this._fabric(r)
      const index = array.push(stateful)

      indexes.push(index)
      values.push(stateful)
    })

    this.Added.Emit({ Value: values, Indexes: indexes })

    this._version++
  }

  public Remove(index: number): void {
    const array = this.Get()
    const remove = array.splice(index, 1)!

    this.Removed.Emit({ Value: remove, Indexes: [index] })

    this._version++
  }

  public Update(index: number, setter: StatefulSetter<T>) {
    const array = this.Get()

    array[index].Set(setter)

    this.Updated.Emit({ Value: array[index], Index: index })

    this._version++
  }

  public Swap(a: number, b: number): void {
    const array = this.Get()
    const temporary = array[a]

    array[a] = array[b]
    array[b] = temporary

    this.Swapped.Emit({ From: a, To: b })

    this._version++
  }

  public Select(predicate: (item: T, index: number) => boolean): AbstractStateful<T> | undefined {
    const array = this.Value

    for (let index = 0; index < array.length; index++) {
      if (predicate(array[index].Value, index)) {
        this.Selected.Emit({ Value: [array[index]], Indexes: [index] })
        return array[index]
      }
    }
  }

  public SelectIndex(index: number): U {
    const array = this.Value

    this.Selected.Emit({ Value: [array[index]], Indexes: [index] })

    return array[index] as U
  }

  public Clear(): void {
    const value = this.Value

    this._value = []

    this.Cleared.Emit({ Value: value })

    this._version++
  }

  public Dispose(): void {
    this.Added.Clear()
    this.Removed.Clear()
    this.Swapped.Clear()
    this.Cleared.Clear()
    this.Replaced.Clear()

    this._version = 0
  }

  public get Length(): number {
    return this.Get().length
  }

  public get Value(): U[] {
    return this.Get()
  }

  public get Version(): number {
    return this._version
  }
}