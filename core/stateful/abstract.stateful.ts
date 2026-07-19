export interface AbstractStateful<T> {
  Get(): T

  Set(value: (value: T) => T): void

  DirectSet(value: T): void

  get Value(): T

  get Version(): number
}