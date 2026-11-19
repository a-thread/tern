import { asError, crashReport } from './crashReport';

it('turns anything thrown into an Error', () => {
  expect(asError('boom').message).toBe('boom');
  expect(asError({ code: 42 }).message).toBe('{"code":42}');
  const e = new TypeError('t');
  expect(asError(e)).toBe(e);
});

it('writes the version, platform, message and stack', () => {
  const e = new TypeError('x is undefined');
  e.stack = 'TypeError: x is undefined\n    at a (address at index.android.bundle:1:100)';
  const text = crashReport(e, {
    version: '0.10.0',
    platform: 'android 31',
    at: new Date('2026-11-17T12:00:00Z'),
  });
  expect(text).toContain('Tern 0.10.0 on android 31');
  expect(text).toContain('2026-11-17T12:00:00.000Z');
  expect(text).toContain('TypeError: x is undefined');
  expect(text).toContain('index.android.bundle:1:100');
});
