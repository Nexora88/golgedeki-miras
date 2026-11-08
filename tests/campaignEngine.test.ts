import { describe, expect, it } from 'vitest';
import {
  advanceCampaignDay, claimQuest, createInitialCampaign, evaluateEnding,
  exploreRegion, improveDiplomacy, normalizeCampaign, placeCampaignBuilding,
  recruitCampaignSoldier, resolveRegionalChallenge,
} from '../src/game/CampaignEngine';

describe('campaign economy and persistence', () => {
  it('normalizes missing and malformed saves safely', () => {
    expect(normalizeCampaign(null).day).toBe(1);
    expect(normalizeCampaign('{bad-json').regions).toEqual(['north']);
    expect(normalizeCampaign(JSON.stringify({ version: 1, day: 999999, regions: ['bad'] })).day).toBe(999999);
  });

  it('places buildings, persists them, and produces resources each day', () => {
    const state = createInitialCampaign();
    expect(placeCampaignBuilding(state, 'farm', 12, 8)).toBeNull();
    const before = state.food;
    advanceCampaignDay(state);
    expect(state.food).toBeGreaterThan(before);
    expect(state.buildings).toHaveLength(1);
  });

  it('rejects unaffordable construction and recruiting', () => {
    const state = createInitialCampaign();
    state.gold = 0;
    expect(placeCampaignBuilding(state, 'market', 12, 8)).toContain('Yeterli');
    expect(recruitCampaignSoldier(state)).toContain('25 altın');
  });

  it('explores three regions and records diplomacy', () => {
    const state = createInitialCampaign();
    expect(exploreRegion(state, 'whispering-forest')).toContain('keşfedildi');
    expect(exploreRegion(state, 'iron-highlands')).toContain('keşfedildi');
    expect(exploreRegion(state, 'mist-coast')).toContain('keşfedildi');
    expect(state.regions).toHaveLength(4);
    for (const id of ['whispering-forest','iron-highlands','mist-coast'] as const) {
      for (let i=0;i<3;i++) improveDiplomacy(state,id);
    }
    expect(state.relations['mist-coast']).toBeGreaterThan(40);
  });

  it('resolves abstract regional challenges and updates quest rewards', () => {
    const state = createInitialCampaign();
    exploreRegion(state, 'whispering-forest');
    const result = resolveRegionalChallenge(state, 'whispering-forest', 6);
    expect(typeof result.won).toBe('boolean');
    state.army = 10;
    state.quests['royal-guard'] = 'complete';
    const before = state.gold;
    expect(claimQuest(state, 'royal-guard')).toContain('ödülü');
    expect(state.gold).toBeGreaterThan(before);
  });

  it('selects an ending only after the campaign conditions are met', () => {
    const state = createInitialCampaign();
    expect(evaluateEnding(state)).toBeNull();
    state.regions = ['north','whispering-forest','iron-highlands','mist-coast'];
    state.victories = 3;
    state.happiness = 80;
    expect(evaluateEnding(state)).toBe('unifier');
  });
});
