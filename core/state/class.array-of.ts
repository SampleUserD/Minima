import { AbstractState } from "@/core/state/abstract.state"
import { NextVersion, START_VERSION, Version } from "@/core/state/abstract.version"
import { Trigger } from "@/core/trigger/class.trigger"
import { Signal } from "@/signals/signal.class"

export class StateArrayOf<T> implements AbstractState<T[]> {
  public readonly Appended: Signal<T[]> = new Signal()
  public readonly Swapped: Signal<{ From: number, To: number }> = new Signal()
  public readonly Updated: Signal<{ Value: T, Index: number }> = new Signal()
  public readonly Cleared: Signal<T[]> = new Signal()
  public readonly Replaced: Signal<T[]> = new Signal()
  public readonly Removed: Signal<{ Value: T, Index: number }> = new Signal()
  public readonly Selected: Signal<number> = new Signal()

  private _version: Version = START_VERSION
  private _versions: Version[] = []

  public constructor(private _items: T[]) { }

  public Append(...value: T[]): void {
    this._items.push(...value)

    for (let index = 0; index < value.length; index++) {
      this._versions.push(START_VERSION)
    }

    this._version = NextVersion(this)

    this.Appended.Emit(value)
  }

  public Remove(index: number): void {
    const remove = this._items.splice(index, 1)
    this._versions.splice(index, 1)

    this._version = NextVersion(this)

    this.Removed.Emit({ Value: remove[0], Index: index })
  }

  public Update(index: number, value: T): void {
    const item = this._items[index]

    this._items[index] = value
    this._versions[index]++

    this.Updated.Emit({ Value: item, Index: index })
  }

  public UpdateBy(index: number, setter: (value: T) => T): void {
    const items = this._items
    const item = items[index]

    items[index] = setter(items[index])

    this._versions[index]++

    this.Updated.Emit({ Value: item, Index: index })
  }

  public SelectBy(index: number): T {
    const item = this._items[index]

    this.Selected.Emit(index)

    return item
  }

  public Clear() {
    const items = this._items

    this._items = []
    this._version = START_VERSION
    this._versions = []

    this.Cleared.Emit(items)
  }

  public Swap(i: number, j: number): void {
    const array = this._items
    const versions = this._versions
    const temporary = array[i]

    array[i] = array[j]
    array[j] = temporary

    versions[i]++
    versions[j]++

    this._version = NextVersion(this)
    this.Swapped.Emit({ From: i, To: j })
  }

  public Get(): T[] {
    return this._items
  }

  public Set(value: T[]): void {
    this._items = value

    for (let index = 0, length = this._items.length; index < length; index++) {
      const version = this._versions[index] || 0

      this._versions[index] = version + 1
    }

    this._version = NextVersion(this)

    this.Replaced.Emit(value)
  }

  public get Version(): Version {
    return this._version
  }

  public get Updates(): Version[] {
    return this._versions
  }

  public get Value(): T[] {
    return this._items
  }

  public get Length(): number {
    return this.Value.length
  }
}