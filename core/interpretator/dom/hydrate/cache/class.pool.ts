import { Clone, Release, Template } from "@/core/interpretator/dom/hydrate/cache/types.template"

export class Pool {
  private _pool: Template[] = []

  public constructor(private _template: Template) { }

  public Get(): Template {
    if (this._pool.length > 0) {
      return this._pool.pop()
    }

    return Clone(this._template)
  }

  public Push(template: Template): void {
    this._pool.push(template)
  }

  public Release(template: Template): void {
    Release(template)
    this._pool.push(template)
  }
}