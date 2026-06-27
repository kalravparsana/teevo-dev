import { describe, expect, it } from 'vitest';
import { imageFileErrorMessage, validateImageFile } from './readImageFile';

describe('validateImageFile', () => {
  it('accepts supported image types within size limit', () => {
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    expect(validateImageFile(file)).toBeNull();
  });

  it('rejects unsupported types', () => {
    const file = new File(['x'], 'logo.gif', { type: 'image/gif' });
    expect(validateImageFile(file)).toBe('type');
    expect(imageFileErrorMessage('type')).toMatch(/PNG/);
  });

  it('rejects oversized files', () => {
    const file = new File([new Uint8Array(600 * 1024)], 'logo.png', { type: 'image/png' });
    expect(validateImageFile(file)).toBe('size');
  });
});
