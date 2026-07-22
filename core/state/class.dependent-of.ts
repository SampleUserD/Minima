import { AbstractState } from "@/core/state/abstract.state"

export class StatefulDependentOf<T, U> implements AbstractState<U> {
  private _cache: U | null = null
  private _version: number = 0

  public constructor(private _source: AbstractState<T>, private _compute: (value: T) => U) {
    this._cache = this._compute(this._source.Value)
  }

  public Set(value: U): never {
    throw new Error(`You can not set directly to readonly stateful`)
  }

  public Get(): U {
    if (this._version !== this._source.Version) {
      this._cache = this._compute(this._source.Value)
      this._version = this._source.Version
    }

    return this._cache!
  }

  public get Value() {
    return this.Get()
  }

  public get Version(): number {
    return this._version
  }
}