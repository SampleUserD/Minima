import { Version } from "@/core/state/abstract.version"

export interface AbstractState<T> {
  Get(): T
  Set(value: T): void

  get Version(): Version
  get Value(): T
}