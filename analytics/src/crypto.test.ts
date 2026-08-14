import { describe, expect, it } from 'vitest';
import { hmacHex, signObject, verifyObject } from './crypto';

describe('signed tokens and visitor hashes', () => {
  const key = 'test-key-with-more-than-thirty-two-characters';

  it('round-trips a signed object and rejects tampering', async () => {
    const token = await signObject({ sub: 118019556, exp: 2_000_000_000 }, key);
    await expect(verifyObject(token, key)).resolves.toEqual({ sub: 118019556, exp: 2_000_000_000 });
    await expect(verifyObject(`${token.slice(0, -1)}x`, key)).resolves.toBeNull();
  });

  it('produces deterministic non-plaintext hashes', async () => {
    const first = await hmacHex(key, 'visitor:v1|192.0.2.1|Chrome|macOS');
    const second = await hmacHex(key, 'visitor:v1|192.0.2.1|Chrome|macOS');
    expect(first).toBe(second);
    expect(first).toHaveLength(64);
    expect(first).not.toContain('192.0.2.1');
  });
});
