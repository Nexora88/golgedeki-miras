import { describe, expect, it } from 'vitest';
import { normalizeStoryProgress } from '../src/story/StoryOverlay';

describe('story progress', () => {
  it('starts at the prologue when no save exists', () => {
    expect(normalizeStoryProgress(null)).toEqual({ chapter: 0, choices: {} });
  });

  it('restores saved choices and chapter progress', () => {
    expect(normalizeStoryProgress(JSON.stringify({
      chapter: 2,
      choices: { 'last-night': 'protect-people' },
    }))).toEqual({
      chapter: 2,
      choices: { 'last-night': 'protect-people' },
    });
  });

  it('clamps invalid chapter numbers and ignores malformed saves', () => {
    expect(normalizeStoryProgress(JSON.stringify({ chapter: 99, choices: {} })).chapter).toBe(3);
    expect(normalizeStoryProgress('{broken')).toEqual({ chapter: 0, choices: {} });
  });
});
