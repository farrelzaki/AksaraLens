import { describe, expect, it } from 'vitest';
import { keLogis, keVisual } from './urutan';

describe('keLogis', () => {
  it('memindah taling ke belakang hurufnya', () => {
    expect(keLogis('ꦺꦏ')).toBe('ꦏꦺ');
  });

  it('menangani taling tarung', () => {
    expect(keLogis('ꦺꦏꦴ')).toBe('ꦏꦺꦴ');
  });

  it('memindah taling ke belakang seluruh kluster pasangan', () => {
    expect(keLogis('ꦲꦤꦺꦏ꧀ꦠ')).toBe('ꦲꦤꦏ꧀ꦠꦺ');
  });

  it('tidak mengubah teks tanpa taling', () => {
    expect(keLogis('ꦲꦤꦕꦫꦏ')).toBe('ꦲꦤꦕꦫꦏ');
  });

  it('kebalikan keVisual', () => {
    for (const s of ['ꦏꦺ', 'ꦱꦺꦴꦠꦺꦴ', 'ꦲꦤꦏ꧀ꦠꦺ', 'ꦩꦺꦗꦺ꧈ꦧꦺꦴꦭ꧉']) {
      expect(keLogis(keVisual(s))).toBe(s);
    }
  });
});
