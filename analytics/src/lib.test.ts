import { describe, expect, it } from 'vitest';
import {
  classifyReferrer,
  isBot,
  normalizeCountry,
  normalizePath,
  parseClient,
  parseDateRange,
  validEventId,
} from './lib';

describe('analytics normalization', () => {
  it('normalizes the GitHub Pages prefix and removes query strings', () => {
    expect(normalizePath('/portfolio/?utm_source=test', '/portfolio')).toBe('/');
    expect(normalizePath('/portfolio/projects/', '/portfolio')).toBe('/projects');
    expect(normalizePath('https://example.com', '/portfolio')).toBeNull();
  });

  it('classifies known sources without retaining full referrer URLs', () => {
    expect(classifyReferrer('', 'https://shuai678.github.io')).toBe('Direct / Unknown');
    expect(classifyReferrer('https://www.google.com/search?q=portfolio', 'https://shuai678.github.io')).toBe(
      'Google',
    );
    expect(classifyReferrer('https://github.com/Shuai678', 'https://shuai678.github.io')).toBe('GitHub');
  });

  it('filters common bots and reduces the user agent to broad categories', () => {
    expect(isBot('Googlebot/2.1')).toBe(true);
    expect(isBot('Mozilla/5.0 Chrome/130.0 Safari/537.36')).toBe(false);
    expect(parseClient('Mozilla/5.0 (iPhone) Version/18.0 Mobile Safari/604.1')).toEqual({
      browser: 'Safari',
      deviceType: 'Mobile',
      os: 'iOS',
    });
  });

  it('validates identifiers, countries, and date ranges', () => {
    expect(validEventId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(validEventId('short')).toBe(false);
    expect(normalizeCountry('it')).toBe('IT');
    expect(normalizeCountry('unknown')).toBe('XX');
    expect(parseDateRange('2026-08-01', '2026-08-07')?.days).toBe(7);
    expect(parseDateRange('2026-08-07', '2026-08-01')).toBeNull();
  });
});
