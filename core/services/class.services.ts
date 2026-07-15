export class Services {
  private static _current: Services = new Services()

  private _services: Map<Function, any> = new Map()
  private _factories: Map<Function, (services: Services) => any> = new Map()

  private _parent: Services | undefined = undefined

  public Register<T>(ctor: Function, factory: (services: Services) => T): void {
    this._factories.set(ctor, factory)
  }

  public Get<T>(ctor: Function): T {
    if (this._services.has(ctor)) {
      return this._services.get(ctor)
    }

    const factory = this._factories.get(ctor)

    if (factory) {
      const instance = factory(this)

      this._services.set(ctor, instance)

      return instance
    }

    if (this._parent !== undefined) {
      return this._parent.Get<T>(ctor)
    }

    throw new Error(`No such factory as ${ctor.name}`)
  }

  public CreateChild(): Services {
    const container = new Services()

    container._parent = this

    return container
  }

  public static get Current(): typeof this._current {
    return Services._current
  }

  public static set Current(value: Services) {
    Services._current = value
  }
}