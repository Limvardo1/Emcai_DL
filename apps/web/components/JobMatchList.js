export default function JobMatchList({ matches = [] }) {
  if (!matches.length) {
    return (
      <p className="text-sm text-slate-500">
        Belum ada rekomendasi profesi untuk analisis ini.
      </p>
    );
  }

  const top = matches[0]?.match || 1;

  return (
    <ol className="grid gap-3 sm:grid-cols-3">
      {matches.map((item, index) => {
        const match = Number(item.match || 0);
        // Skala relatif terhadap peringkat 1 agar selisih antar profesi terbaca.
        const relative = top > 0 ? Math.max(6, (match / top) * 100) : 0;
        const matched = (item.matched_skills || []).slice(0, 4);
        const missing = (item.missing_skills || []).slice(0, 3);

        return (
          <li
            key={`${item.family_key}-${item.role}`}
            className={`rounded-2xl border p-4 ${
              index === 0 ? 'border-brand-300 bg-brand-50/40' : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`grid h-6 w-6 place-items-center rounded-lg text-[11px] font-bold ${
                  index === 0 ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {index + 1}
              </span>
              <span className="text-sm font-semibold tabular-nums text-slate-800">
                {item.match.toFixed(1)}%
              </span>
            </div>

            <p className="mt-3 text-sm font-semibold leading-snug text-slate-900">
              {item.role}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{item.family_label}</p>

            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${index === 0 ? 'bg-brand-600' : 'bg-brand-300'}`}
                style={{ width: `${relative}%` }}
              />
            </div>

            {matched.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {matched.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}

            {missing.length > 0 && (
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                Perlu ditambah: {missing.join(', ')}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
