import { describe, expect, it } from 'vitest';
import { urlModel } from './onnx';

describe('urlModel', () => {
  it('memakai folder lokal secara bawaan dan URL Supabase bila diisi', () => {
    expect(urlModel('model1', '/models')).toBe('/models/aksaralens_huruf.onnx');
    expect(urlModel('model2a', 'https://x.supabase.co/storage/v1/object/public/models/v2/')).toBe(
      'https://x.supabase.co/storage/v1/object/public/models/v2/aksaralens_pembaca_b2.onnx',
    );
  });
});
