import type {
	ComponentFromKey,
	ComponentKey,
	ComponentMap,
	TypeOfComponent,
} from '~/types/component.js';
import type { BaseTypedEntity, Entity } from '~/types/entity.js';
import type { InternalLionecs } from '~/types/lionecs.js';
import type { LionecsState } from '~/types/state.js';
import { isComponent } from '~/utils/component.js';
import { useDefineMethods } from '~/utils/methods.js';

export function getModule<M extends ComponentMap>() {
	const defineMethods = useDefineMethods<M>();

	type GetOptions = {
		optional?: boolean;
	};

	// For overload `get(state, entity, component, options)`
	function get<
		E extends Entity,
		K extends E extends BaseTypedEntity<M, infer Req, infer Opt>
			? Req | Opt
			: ComponentKey<M>,
		O extends E extends BaseTypedEntity<M, infer _Req, infer Opt>
			? K extends Opt
				? { optional: true }
				: { optional: false }
			: GetOptions
	>(
		state: LionecsState<M>,
		entity: E,
		component: K | ComponentFromKey<M, K>,
		options?: O
	): O extends GetOptions
		? O['optional'] extends true
			? TypeOfComponent<M[K]> | undefined
			: TypeOfComponent<M[K]>
		: TypeOfComponent<M[K]> | undefined;

	// For overload `get(entity, component, options)`
	function get<
		E extends Entity,
		K extends E extends BaseTypedEntity<M, infer Req, infer Opt>
			? Req | Opt
			: ComponentKey<M>,
		O extends E extends BaseTypedEntity<M, infer _Req, infer Opt>
			? K extends Opt
				? { optional: true }
				: { optional: false }
			: GetOptions
	>(
		entity: E,
		component: K | ComponentFromKey<M, K>,
		options?: O
	): O extends GetOptions
		? O['optional'] extends true
			? TypeOfComponent<M[K]> | undefined
			: TypeOfComponent<M[K]>
		: TypeOfComponent<M[K]> | undefined;

	function get<K extends ComponentKey<M>>(
		this: InternalLionecs<M>,
		...args: unknown[]
	): TypeOfComponent<M[K]> {
		// Case: get(entity, component, options)
		if ('__key' in (args[0] as Entity)) {
			const [entity, component, options] = args as [
				Entity,
				K | ComponentFromKey<M, K>,
				GetOptions | undefined
			];
			const optional = options?.optional ?? true;
			const componentKey = this.getComponentKey(component);

			const componentState = this.state.components[componentKey][entity.__key];

			if (!optional && componentState === undefined) {
				throw new Error(
					`State not found for component ${componentKey} on entity ${entity.__key}.`
				);
			}

			return componentState as TypeOfComponent<M[K]>;
		}
		// Case: get(state, entity, component, options)
		else {
			const [state, entity, component, options] = args as [
				LionecsState<M>,
				Entity,
				K | ComponentFromKey<M, K>,
				GetOptions | undefined
			];
			const componentKey = this.getComponentKey(component);
			const optional = options?.optional ?? true;

			const componentState = state.components[componentKey][entity.__key];

			if (!optional && componentState === undefined) {
				throw new Error(
					`State not found for component ${componentKey} on entity ${entity.__key}.`
				);
			}

			return componentState as TypeOfComponent<M[K]>;
		}
	}

	function getOpt<K extends ComponentKey<M>>(
		state: LionecsState<M>,
		entity: Entity,
		component: K | ComponentFromKey<M, K>
	): TypeOfComponent<M[K]> | undefined;

	function getOpt<K extends ComponentKey<M>>(
		entity: Entity,
		component: K | ComponentFromKey<M, K>
	): TypeOfComponent<M[K]> | undefined;

	function getOpt<K extends ComponentKey<M>>(
		this: InternalLionecs<M>,
		...args: unknown[]
	): TypeOfComponent<M[K]> | undefined {
		// Case: getOpt(state, entity, component)
		if (args.length === 3) {
			const [state, entity, component] = args as [
				LionecsState<M>,
				Entity,
				K | ComponentFromKey<M, K>
			];
			const componentKey = this.getComponentKey(component);
			return state.components[componentKey][entity.__key] as TypeOfComponent<
				M[K]
			>;
		}
		// Case: getOpt(entity, component)
		else {
			const [entity, component] = args as [Entity, K | ComponentFromKey<M, K>];
			const componentKey = this.getComponentKey(component);
			return this.state.components[componentKey][
				entity.__key
			] as TypeOfComponent<M[K]>;
		}
	}

	return defineMethods({
		get,
		getOpt,
		getComponentKey<K extends ComponentKey<M>>(
			component: K | ComponentFromKey<M, K>
		): K {
			return isComponent(component) ? component.__key : component;
		},
	});
}
