import type { Entity } from '~/types';
import type { ComponentKey, ComponentMap } from '~/types/component';
import type { EntityPProxy } from '~/types/proxy';
import { useDefineMethods } from '~/utils/methods';

export function proxyModule<M extends ComponentMap>() {
	const defineMethods = useDefineMethods<M>();

	return defineMethods({
		/**
		 * `p(entity)[component]` is equivalent to `ecs.get(entity, component)`
		 * `p(entity)[component] = value` is equivalent to `ecs.set(entity, component, value)`
		 * `p(entity)[component].key = value` is equivalent to `ecs.update(entity, component, (oldState) => {
		 *    oldState.key = value;
		 *  })
		 */
		p<E extends Entity>(entity: E): EntityPProxy<M, E> {
			return new Proxy(
				{},
				{
					get: (_target, key) => {
						const componentKey = key as ComponentKey<M>;
						const componentValue = this.getOpt(entity, componentKey);
						// If the underlying data structure is an object, return a proxy
						if (typeof componentValue === 'object' && componentValue !== null) {
							const proxyHandler: ProxyHandler<{ value: unknown }> = {
								get: (target, key) => {
									const innerComponentValue = (target.value as any)[key];
									// If the inner data structure is yet another object, return another proxy wrapping
									// the inner object
									if (
										innerComponentValue !== null &&
										typeof innerComponentValue === 'object'
									) {
										return new Proxy(
											{ value: innerComponentValue },
											proxyHandler
										);
									} else {
										return innerComponentValue;
									}
								},
								set: (_target, key, value) => {
									this.update(entity, componentKey, (oldComponentState) => {
										(oldComponentState as any)[key] = value;
										return oldComponentState;
									});
									return true;
								},
							};

							return new Proxy({ value: componentValue }, proxyHandler);
						} else {
							return componentValue;
						}
					},
					set: (_target, key, value) => {
						const component = key as ComponentKey<M>;
						this.set(entity, component, value);
						return true;
					},
				}
			) as EntityPProxy<M, E>;
		},
	});
}