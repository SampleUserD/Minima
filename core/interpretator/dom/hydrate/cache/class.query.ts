export class Query {
  private _cache: Map<string, HTMLElement[]> = new Map()

  public Query(selector: string, container: HTMLElement | DocumentFragment): HTMLElement[] {
    let cache: any = this._cache.get(selector)!

    if (cache === undefined) {
      cache = container.querySelectorAll(selector)

      this._cache.set(selector, cache)
    }

    return cache
  }

  public Invalidate(selector: string): void {
    this._cache.delete(selector)
  }

  public Clear(): void {
    this._cache.clear()
  }
}