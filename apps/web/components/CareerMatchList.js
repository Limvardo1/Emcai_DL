export default function CareerMatchList({ matches = [] }) {
  if (!matches.length) {
    return <p className="text-sm text-slate-500">Belum ada rekomendasi.</p>;
  }

  const top = matches[0]?.match || 1;

  return (
    <ol className="space-y-4">
      {matches.map((item, index) => {
        // Skala relatif terhadap peringkat 1 agar perbedaan antar karier terlihat
        const relative = top > 0 ? Math.max(4, (item.match / top) * 100) : 0;
        return (
          <li key={item.family_key}>
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-md text-[11px] font-bold ${
                    index === 0 ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {index + 1}
                </span>
                <span className="truncate text-sm font-medium text-slate-800">{item.label}</span>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-700">
                {item.match.toFixed(1)}%
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${index === 0 ? 'bg-brand-600' : 'bg-brand-300'}`}
                style={{ width: `${relative}%` }}
              />
            </div>
            {index === 0 && item.description && (
              <p className="mt-1.5 text-xs text-slate-500">{item.description}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
