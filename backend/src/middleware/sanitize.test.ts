// ============================================
// AgriCore — Sanitization Middleware Tests
// ============================================

import { describe, it, expect } from 'vitest';
import { sanitizeBody } from '../middleware/sanitize';

function mockReq(body: unknown) {
  return { body } as any;
}

function mockRes() {
  return {} as any;
}

function mockNext() {
  const fn = (() => {}) as any;
  fn.called = false;
  const wrapper = (() => { wrapper.called = true; }) as any;
  wrapper.called = false;
  return wrapper;
}

describe('sanitizeBody', () => {
  it('should escape HTML in string fields', () => {
    const req = mockReq({ name: '<script>alert("xss")</script>', age: 25 });
    const next = mockNext();
    sanitizeBody(req, mockRes(), next);

    expect(req.body.name).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    expect(req.body.age).toBe(25);
    expect(next.called).toBe(true);
  });

  it('should trim whitespace from strings', () => {
    const req = mockReq({ email: '  user@test.com  ' });
    const next = mockNext();
    sanitizeBody(req, mockRes(), next);

    expect(req.body.email).toBe('user@test.com');
    expect(next.called).toBe(true);
  });

  it('should sanitize nested objects', () => {
    const req = mockReq({
      user: { name: '<b>bold</b>', settings: { bio: '<img onerror=alert(1)>' } },
    });
    const next = mockNext();
    sanitizeBody(req, mockRes(), next);

    expect(req.body.user.name).toBe('&lt;b&gt;bold&lt;&#x2F;b&gt;');
    expect(req.body.user.settings.bio).toBe('&lt;img onerror=alert(1)&gt;');
  });

  it('should sanitize arrays of strings', () => {
    const req = mockReq({ tags: ['<script>', 'safe', '&evil'] });
    const next = mockNext();
    sanitizeBody(req, mockRes(), next);

    expect(req.body.tags[0]).toBe('&lt;script&gt;');
    expect(req.body.tags[1]).toBe('safe');
    expect(req.body.tags[2]).toBe('&amp;evil');
  });

  it('should pass through null and undefined bodies', () => {
    const req = mockReq(null);
    const next = mockNext();
    sanitizeBody(req, mockRes(), next);
    expect(next.called).toBe(true);
  });

  it('should preserve non-string types', () => {
    const req = mockReq({ count: 42, active: true, data: null });
    const next = mockNext();
    sanitizeBody(req, mockRes(), next);

    expect(req.body.count).toBe(42);
    expect(req.body.active).toBe(true);
    expect(req.body.data).toBeNull();
  });
});
