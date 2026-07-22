export class Pool<T> {
  private _items: T[] = []

  public constructor(private _clone: () => T) { }

  public Acquire(): T {
    if (this._items.length > 0) {
      return this._items.pop()!
    }

    return this._clone()
  }

  public Release(item: T): void {
    this._items.push(item)
  }
}