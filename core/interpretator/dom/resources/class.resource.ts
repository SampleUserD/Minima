export class ResourceRegistry<T> {
  private _resources: T[] = []

  public Register(resource: T): number {
    this._resources.push(resource)

    return this._resources.length - 1
  }

  public Get(index: number): T {
    return this._resources[index]
  }
}