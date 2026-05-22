import { describe, expect, it } from 'vitest';

import { getLootTemplatesForDistrict, LOOT_TEMPLATES, MARKET_SOURCE_ITEMS } from './lootCatalog';
import { getMarketCategoryForItem } from '../store/gameStore';

describe('lootCatalog', () => {
  it('adds 200 new loot templates and covers every market category', () => {
    expect(LOOT_TEMPLATES.common).toHaveLength(56);
    expect(LOOT_TEMPLATES.uncommon).toHaveLength(56);
    expect(LOOT_TEMPLATES.rare).toHaveLength(49);
    expect(LOOT_TEMPLATES.epic).toHaveLength(39);
    expect(LOOT_TEMPLATES.legendary).toHaveLength(26);
    expect(LOOT_TEMPLATES.illegal).toHaveLength(20);
    expect(MARKET_SOURCE_ITEMS).toHaveLength(246);
    expect(MARKET_SOURCE_ITEMS.some((item) => item.name === 'Legendary Keyboard' && item.rarity === 'legendary')).toBe(true);

    const categories = [...new Set(MARKET_SOURCE_ITEMS.map((item) => getMarketCategoryForItem(item)))].sort();

    expect(categories).toEqual(['Electronics', 'Illegal', 'Metals', 'Software', 'Vehicles']);
  });

  it('weights teardown-rack scrap heavily in slums common loot', () => {
    const slumsCommon = getLootTemplatesForDistrict('slums', 'common');
    const countById = slumsCommon.reduce<Record<string, number>>((acc, item) => {
      acc[item.id] = (acc[item.id] ?? 0) + 1;
      return acc;
    }, {});

    expect(slumsCommon).toHaveLength(96);
    expect(countById.c1).toBe(11);
    expect(countById.c2).toBe(11);
    expect(countById.c28).toBe(11);
    expect(countById.c34).toBe(11);
  });
});