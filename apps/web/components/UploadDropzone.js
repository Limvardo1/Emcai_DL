'use client';

import { useRef, useState } from 'react';

const ACCEPTED = ['.pdf', '.docx'];
const MAX_MB = 5;

export default function UploadDropzone({ file, onSelect, disabled }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [clientError, setClientError] = useState('');

  function validate(candidate) {
    if (!candidate) return false;
    const name = candidate.name.toLowerCase();
    if (!ACCEPTED.some((ext) => name.endsWith(ext))) {
      setClientError('Format harus PDF atau DOCX.');
      return false;
    }
    if (candidate.size > MAX_MB * 1024 * 1024) {
      setClientError(`Ukuran file melebihi ${MAX_MB} MB.`);
      return false;
    }
    setClientError('');
    return true;
  }

  function handleFiles(files) {
    const candidate = files?.[0];
    if (validate(candidate)) onSelect(candidate);
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!disabled) handleFiles(event.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition ${
          dragging
            ? 'border-brand-500 bg-brand-50'
            : 'border-slate-300 bg-white hover:border-brand-400 hover:bg-slate-50'
        } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6">
            <path d="M12 16V4m0 0L8 8m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>

        {file ? (
          <>
            <p className="mt-4 text-sm font-semibold text-slate-900">{file.name}</p>
            <p className="mt-1 text-xs text-slate-500">
              {(file.size / 1024).toFixed(0)} KB · klik untuk mengganti
            </p>
          </>
        ) : (
          <>
            <p className="mt-4 text-sm font-semibold text-slate-900">
              Tarik file CV ke sini, atau klik untuk memilih
            </p>
            <p className="mt-1 text-xs text-slate-500">PDF atau DOCX · maksimal {MAX_MB} MB</p>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          disabled={disabled}
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>

      {clientError && <p className="mt-2 text-sm text-rose-600">{clientError}</p>}
    </div>
  );
}
