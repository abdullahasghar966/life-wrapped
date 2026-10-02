import { Unzip, UnzipInflate, type UnzipFile } from 'fflate';
import { isInterestingZipEntry } from './detect';

export interface ZipEntry {
  path: string;
  file: File;
}

/**
 * Streams a zip and inflates only the entries that look like export files
 * (see `isInterestingZipEntry`). Everything else is skipped without being decompressed.
 */
export async function unzipFiltered(
  zip: Blob,
  isCancelled: () => boolean = () => false,
): Promise<{ entries: ZipEntry[]; ignored: number }> {
  const entries: ZipEntry[] = [];
  const pending: Promise<void>[] = [];
  let ignored = 0;

  const unzip = new Unzip((entry: UnzipFile) => {
    if (!isInterestingZipEntry(entry.name)) {
      ignored++;
      return;
    }
    pending.push(
      new Promise<void>((resolve, reject) => {
        const chunks: Uint8Array[] = [];
        entry.ondata = (err, chunk, final) => {
          if (err) return reject(err);
          if (chunk.length) chunks.push(chunk);
          if (final) {
            const base = entry.name.split('/').pop() ?? entry.name;
            entries.push({
              path: entry.name,
              file: new File(chunks as BlobPart[], base),
            });
            resolve();
          }
        };
        entry.start();
      }),
    );
  });
  unzip.register(UnzipInflate);

  const reader = zip.stream().getReader();
  for (;;) {
    if (isCancelled()) {
      await reader.cancel();
      throw new CancelledError();
    }
    const { done, value } = await reader.read();
    if (done) {
      unzip.push(new Uint8Array(0), true);
      break;
    }
    unzip.push(value);
  }
  await Promise.all(pending);
  return { entries, ignored };
}

export class CancelledError extends Error {
  constructor() {
    super('Ingestion cancelled');
    this.name = 'CancelledError';
  }
}
