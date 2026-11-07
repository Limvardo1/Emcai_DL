import { scoreTone } from '@/lib/format';

export default function ScoreGauge({ score = 0, grade }) {
  const tone = scoreTone(score);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, score)) / 100);

  return (
    <div className="flex items-center gap-5">
      <div className="relative h-32 w-32 shrink-0">
        <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={tone.ring}
            stroke="currentColor"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${tone.text}`}>{score}</span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">/ 100</span>
        </div>
      </div>
      <div>
        <span className={`badge ${tone.bg} ${tone.text}`}>{grade || tone.label}</span>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Skor gabungan dari keyakinan model, kecocokan skill, keyword ATS, kelengkapan bagian,
          dan kualitas tulisan.
        </p>
      </div>
    </div>
  );
}
