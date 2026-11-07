const LABELS = {
  confidence: 'Keyakinan',
  skill_match: 'Skill',
  ats_keyword: 'ATS',
  sections: 'Struktur',
  writing: 'Tulisan',
};

const ORDER = ['confidence', 'skill_match', 'ats_keyword', 'sections', 'writing'];

export default function ScoreRadar({ breakdown = {}, maxScores = {} }) {
  const size = 300;
  const center = size / 2;
  const radius = 92;
  const count = ORDER.length;

  const values = ORDER.map((key) => {
    const max = maxScores[key] || 25;
    const value = breakdown[key] || 0;
    return Math.round((value / max) * 100);
  });

  const angleAt = (index) => (Math.PI * 2 * index) / count - Math.PI / 2;
  const pointAt = (index, ratio) => [
    center + Math.cos(angleAt(index)) * radius * ratio,
    center + Math.sin(angleAt(index)) * radius * ratio,
  ];

  const rings = [0.25, 0.5, 0.75, 1];
  const polygon = values
    .map((value, index) => pointAt(index, Math.max(value, 2) / 100).map((n) => n.toFixed(1)).join(','))
    .join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto h-auto w-full max-w-[300px]" role="img" aria-label="Profil skor">
      {rings.map((ratio) => (
        <polygon
          key={ratio}
          points={ORDER.map((_, index) => pointAt(index, ratio).map((n) => n.toFixed(1)).join(',')).join(' ')}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="1"
        />
      ))}

      {ORDER.map((key, index) => {
        const [x, y] = pointAt(index, 1);
        return <line key={key} x1={center} y1={center} x2={x} y2={y} stroke="#e2e8f0" strokeWidth="1" />;
      })}

      <polygon points={polygon} fill="#6366f1" fillOpacity="0.28" stroke="#4f46e5" strokeWidth="2" />

      {values.map((value, index) => {
        const [x, y] = pointAt(index, Math.max(value, 2) / 100);
        return <circle key={ORDER[index]} cx={x} cy={y} r="3" fill="#4f46e5" />;
      })}

      {ORDER.map((key, index) => {
        const [x, y] = pointAt(index, 1.22);
        const anchor = Math.abs(x - center) < 6 ? 'middle' : x > center ? 'start' : 'end';
        return (
          <text
            key={key}
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize="11"
            fill="#64748b"
          >
            {LABELS[key]}
          </text>
        );
      })}

      {values.map((value, index) => {
        const [x, y] = pointAt(index, 1.22);
        const anchor = Math.abs(x - center) < 6 ? 'middle' : x > center ? 'start' : 'end';
        return (
          <text
            key={`v-${ORDER[index]}`}
            x={x}
            y={y + 13}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize="10"
            fontWeight="600"
            fill="#334155"
          >
            {value}%
          </text>
        );
      })}
    </svg>
  );
}
