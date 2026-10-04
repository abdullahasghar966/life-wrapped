'use client';
import { FolderOpen, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { filesFromDrop, filesFromFolderInput } from '@/lib/files';

export function DropZone({
  onFiles,
  disabled,
}: {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}) {
  const [over, setOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);

  return (
    <div
      data-testid="drop-zone"
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={async (e) => {
        e.preventDefault();
        setOver(false);
        if (disabled) return;
        onFiles(await filesFromDrop(e.dataTransfer));
      }}
      className={`relative flex flex-col items-center border-2 border-dashed px-6 py-12 text-center transition-colors ${
        over ? 'border-red-ink bg-red/10' : 'border-ink/40 bg-paper-2'
      }`}
    >
      <div aria-hidden className="bg-ink text-paper mb-4 flex size-14 items-center justify-center">
        <Upload className="size-6" />
      </div>
      <p className="font-display text-3xl uppercase">Drop your export zips or files here</p>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        .zip, .json or .csv, as many as you like, or a whole folder. Files are read inside this
        browser tab and never uploaded.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button
          size="lg"
          className="px-5"
          disabled={disabled}
          onClick={() => fileInput.current?.click()}
        >
          <Upload /> Choose files
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="px-5"
          disabled={disabled}
          onClick={() => folderInput.current?.click()}
        >
          <FolderOpen /> Choose a folder
        </Button>
      </div>
      <input
        ref={fileInput}
        data-testid="file-input"
        type="file"
        multiple
        accept=".zip,.json,.csv,.html,application/zip,application/json,text/csv"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = '';
          onFiles(files);
        }}
      />
      <input
        ref={folderInput}
        type="file"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        // @ts-expect-error webkitdirectory is non-standard but supported by every evergreen browser
        webkitdirectory=""
        onChange={(e) => {
          const files = filesFromFolderInput(e.target.files);
          e.target.value = '';
          onFiles(files);
        }}
      />
    </div>
  );
}
