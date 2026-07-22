type TrendChartProps = {
  points: { label: string; value: number }[];
  color?: string; // hex
};

export default function TrendChart({ points, color = "#2296ad" }: TrendChartProps) {
  const width = 640;
  const height = 180;
  const padding = 28;

  const max = Math.max(...points.map((p) => p.value), 1);
  const stepX = (width - padding * 2) / (points.length - 1);

  const coords = points.map((p, i) => {
    const x = padding + i * stepX;
    const y = height - padding - (p.value / max) * (height - padding * 2);
    return { x, y, ...p };
  });

  const path = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`)
    .join(" ");

  const areaPath = `${path} L ${coords[coords.length - 1].x} ${height - padding} L ${coords[0].x} ${height - padding} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img">
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={areaPath} fill="url(#trendFill)" />
      <path d={path} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

      {coords.map((c) => (
        <g key={c.label}>
          <circle cx={c.x} cy={c.y} r={4} fill="white" stroke={color} strokeWidth={2} />
          <text x={c.x} y={c.y - 12} textAnchor="middle" fontSize="11" fill="#4a4a4a">
            {c.value}
          </text>
          <text x={c.x} y={height - 8} textAnchor="middle" fontSize="10" fill="#6f6f6f">
            {c.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
