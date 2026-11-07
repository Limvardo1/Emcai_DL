export default function SkillChips({ matched = [], missing = [] }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Sudah ada ({matched.length})
        </p>
        <div className="flex flex-wrap gap-1.5">
          {matched.length ? (
            matched.map((skill) => (
              <span
                key={skill}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700"
              >
                {skill}
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-500">Belum ada skill kunci yang cocok.</span>
          )}
        </div>
      </div>

      {missing.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Disarankan ditambahkan ({missing.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {missing.map((skill) => (
              <span
                key={skill}
                className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
