import { BaseTypedEntity, KeyOfComponent } from '~/exports.js';
import type {
	EnemyEntity,
	PlayerEntity,
	WeaponEntity,
} from '~test/defs/entity.js';
import { createEcs } from '~test/utils/ecs.js';

import type * as Component from '../defs/component';

type ComponentsMap = typeof Component;

test('creates', () => {
	const ecs = createEcs();
	const p = ecs.useProxy();

	const sword = ecs.entity<WeaponEntity>({
		damage: 10,
		inventoryItem: true,
		name: 'MySword',
	});

	const enemy = ecs.entity<EnemyEntity>({
		damage: 5,
		health: 50,
	});

	const player = ecs.entity<PlayerEntity>({
		health: 100,
		inventory: {
			primary: sword,
			secondary: null,
		},
		name: 'Leon',
	});

	function attack({
		attacker,
		defender,
	}: {
		attacker: BaseTypedEntity<ComponentsMap, KeyOfComponent<Component.Damage>>;
		defender: BaseTypedEntity<ComponentsMap, KeyOfComponent<Component.Health>>;
	}) {
		p(defender).health -= p(attacker).damage;
	}

	attack({ attacker: enemy, defender: player });

	expect(p(player).health).toBe(95);

	attack({ attacker: sword, defender: enemy });

	expect(p(enemy).health).toBe(40);

	function swapInventoryItems(
		entity: BaseTypedEntity<ComponentsMap, KeyOfComponent<Component.Inventory>>
	) {
		const inventory = p(entity).inventory;
		[inventory.primary, inventory.secondary] = [
			inventory.secondary,
			inventory.primary,
		];
	}

	swapInventoryItems(player);

	expect(p(player).inventory.primary).toBe(null);
	expect(p(player).inventory.secondary).toBe(sword);
});
