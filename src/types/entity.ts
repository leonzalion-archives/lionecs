import type { ComponentBase, ComponentKey, ComponentState } from './state';

export type Entity = string;

export type EntityMap<
	C extends ComponentBase,
	S extends ComponentState<C>,
	K extends ComponentKey<C>
> = Record<Entity, Readonly<S[K]>>;

export type TypedEntity<
	C extends ComponentBase,
	R extends ComponentKey<C>,
	O extends ComponentKey<C> | undefined = undefined
> = Entity & {
	__required: {
		[K in R]: K;
	};
	__optional: O extends ComponentKey<C>
		? {
				[K in O]: K;
		  }
		: Record<never, never>;
};

export type EntityComponent<
	C extends ComponentBase,
	E extends Entity
> = E extends TypedEntity<infer R, infer O> ? R | O : ComponentKey<C>;
