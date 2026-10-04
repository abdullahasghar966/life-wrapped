import { describe, expect, it, vi } from 'vitest';
import { canShareFiles, canShareUrl, cardImageName, openShareSheet } from '@/share/nativeShare';

const png = () => new File([new Uint8Array([137, 80, 78, 71])], 'card.png', { type: 'image/png' });
const domError = (name: string) => Object.assign(new Error(name), { name });

describe('the device share sheet', () => {
  it('needs both share() and canShare() to share files', () => {
    expect(canShareFiles([png()], {})).toBe(false);
    expect(canShareFiles([png()], { share: vi.fn() })).toBe(false);
    expect(canShareFiles([png()], { share: vi.fn(), canShare: () => true })).toBe(true);
    expect(canShareFiles([png()], { share: vi.fn(), canShare: () => false })).toBe(false);
    const throws = () => {
      throw new TypeError('bad data');
    };
    expect(canShareFiles([png()], { share: vi.fn(), canShare: throws })).toBe(false);
  });

  it('shares links wherever share() exists, even without canShare()', () => {
    expect(canShareUrl('https://x.test/s/a', {})).toBe(false);
    expect(canShareUrl('https://x.test/s/a', { share: vi.fn() })).toBe(true);
    expect(canShareUrl('https://x.test/s/a', { share: vi.fn(), canShare: () => false })).toBe(
      false,
    );
  });

  it('passes the data through and reports the outcome', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const data = { files: [png()], title: 'Your year in sound' };
    expect(await openShareSheet(data, { share })).toBe('shared');
    expect(share).toHaveBeenCalledWith(data);

    // Closing the sheet without picking an app is not an error.
    share.mockRejectedValueOnce(domError('AbortError'));
    expect(await openShareSheet(data, { share })).toBe('cancelled');

    // For example, the user gesture expired.
    share.mockRejectedValueOnce(domError('NotAllowedError'));
    expect(await openShareSheet(data, { share })).toBe('failed');
    expect(await openShareSheet(data, {})).toBe('failed');
  });

  it('names images after the card', () => {
    expect(cardImageName('spotify.summary')).toBe('life-wrapped-spotify-summary.png');
  });
});
