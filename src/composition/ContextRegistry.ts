import { type ContextClass } from '../app/ComponentHead'

/**
 * Registry for sharing typed context instances across component boundaries.
 *
 * Entries are keyed by the runtime constructor of each registered instance:
 * - one active entry per concrete constructor
 * - registering another instance of the same constructor replaces the previous
 *
 * Lookup is type-based and uses `instanceof`, so querying a base class can
 * resolve a registered subclass instance.
 */
export class ContextRegistry {
  private readonly byConstructor = new Map<ContextClass<object>, object>()

  /**
   * Registers a context instance under its concrete runtime constructor.
   *
   * If an instance with the same constructor already exists, it is replaced.
   *
   * @param context - Context instance to register.
   */
  register<TContext extends object>(context: TContext): void {
    this.byConstructor.set(context.constructor as ContextClass<object>, context)
  }

  /**
   * Removes the entry for a constructor.
   *
   * No-op when the constructor is not registered.
   *
   * @param contextClass - Constructor key to remove.
   */
  unregisterByClass<TContext extends object>(
    contextClass: ContextClass<TContext>,
  ): void {
    this.byConstructor.delete(contextClass)
  }

  /**
   * Removes a specific context instance if it is currently registered for its
   * constructor.
   *
   * This prevents deleting a newer replacement instance of the same class.
   *
   * @param context - Context instance to remove.
   */
  unregister<TContext extends object>(context: TContext): void {
    const key = context.constructor as ContextClass<object>
    if (this.byConstructor.get(key) === context) {
      this.byConstructor.delete(key)
    }
  }

  /**
   * Finds a context instance by constructor type.
   *
   * The registry is scanned in insertion order and each entry is checked with
   * `instanceof contextClass`.
   *
   * @param contextClass - Class to match via `instanceof`.
   * @returns Matching instance, or `undefined` when not found.
   */
  find<TContext extends object>(
    contextClass: ContextClass<TContext>,
  ): TContext | undefined {
    for (const value of this.byConstructor.values()) {
      if (value instanceof contextClass) return value
    }
    return undefined
  }

  /**
   * Resolves a context instance by constructor type and guarantees a value.
   *
   * @param contextClass - Class to match via `instanceof`.
   * @returns Matching context instance.
   * @throws Error when no matching context is registered.
   */
  require<TContext extends object>(
    contextClass: ContextClass<TContext>,
  ): TContext {
    const value = this.find(contextClass)
    if (value) return value
    throw new Error(
      `${contextClass.name} is not registered in ContextRegistry.`,
    )
  }
}
