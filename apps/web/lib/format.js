export function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatBytes(bytes) {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function scoreTone(score) {
  if (score >= 75) {
    return {
      text: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      ring: 'text-emerald-500',
      bar: 'bg-emerald-500',
      label: 'Siap dikirim',
    };
  }
  if (score >= 55) {
    return {
      text: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      ring: 'text-amber-500',
      bar: 'bg-amber-500',
      label: 'Perlu perbaikan',
    };
  }
  return {
    text: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    ring: 'text-rose-500',
    bar: 'bg-rose-500',
    label: 'Banyak kekurangan',
  };
}

export const BREAKDOWN_LABELS = {
  confidence: 'Keyakinan model',
  skill_match: 'Kecocokan skill',
  ats_keyword: 'Keyword ATS',
  sections: 'Kelengkapan bagian',
  writing: 'Kualitas tulisan',
};
