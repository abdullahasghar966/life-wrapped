const ACCEPTED = /\.(zip|json|csv|html?)$/i;

interface FsEntry {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  file?: (ok: (f: File) => void, err: (e: unknown) => void) => void;
  createReader?: () => {
    readEntries: (ok: (entries: FsEntry[]) => void, err: (e: unknown) => void) => void;
  };
}

function readAll(dir: FsEntry): Promise<FsEntry[]> {
  const reader = dir.createReader!();
  const out: FsEntry[] = [];
  return new Promise((resolve, reject) => {
    // readEntries returns at most ~100 entries per call; keep reading until it returns none.
    const next = () =>
      reader.readEntries((batch) => {
        if (batch.length === 0) resolve(out);
        else {
          out.push(...batch);
          next();
        }
      }, reject);
    next();
  });
}

async function walk(entry: FsEntry, out: File[]): Promise<void> {
  if (entry.isFile && entry.file) {
    if (!ACCEPTED.test(entry.name)) return;
    out.push(await new Promise<File>((ok, err) => entry.file!(ok, err)));
  } else if (entry.isDirectory) {
    for (const child of await readAll(entry)) await walk(child, out);
  }
}

/**
 * Files from a drop, including whole folders (via webkitGetAsEntry). Entries must
 * be grabbed synchronously during the drop event, before any await.
 */
export async function filesFromDrop(dt: DataTransfer): Promise<File[]> {
  const entries: FsEntry[] = [];
  const loose: File[] = [];
  for (const item of Array.from(dt.items ?? [])) {
    if (item.kind !== 'file') continue;
    const entry = (
      item as DataTransferItem & { webkitGetAsEntry?: () => FsEntry | null }
    ).webkitGetAsEntry?.();
    if (entry) entries.push(entry);
    else {
      const f = item.getAsFile();
      if (f) loose.push(f);
    }
  }
  if (entries.length === 0 && loose.length === 0) return Array.from(dt.files ?? []);
  const out: File[] = [...loose];
  for (const e of entries) {
    // A single dropped file is passed on even with an odd extension, so it gets a clear message.
    if (e.isFile && e.file) out.push(await new Promise<File>((ok, err) => e.file!(ok, err)));
    else await walk(e, out);
  }
  return out;
}

/** Files chosen with a folder picker (webkitdirectory) keep only export-like files. */
export function filesFromFolderInput(list: FileList | null): File[] {
  return Array.from(list ?? []).filter((f) => ACCEPTED.test(f.name));
}
