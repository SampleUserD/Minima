import { AbstractState } from "@/core/state/abstract.state"
import { Version, START_VERSION, NextVersion } from "@/core/state/abstract.version"
import { Trigger } from "@/core/trigger/class.trigger"

export class State<T> implements AbstractState<T> {
  private _version: Version = START_VERSION

  public constructor(private _value: T) { }

  public Set(value: T): void {
    this._value = value
    this._version = NextVersion(this)

    Trigger.Trigger("replace")
  }

  public Get(): T {
    return this._value
  }

  public get Version(): number {
    return this._version
  }

  public get Value(): T {
    return this.Get()
  }
}