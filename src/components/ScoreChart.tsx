// Gráfica de exposición (Figma 34:17125): bandas Bueno/Regular/Crítico, línea azul y puntos diarios.
import type { ScoreHistory } from "../api/auth";
import { fmtDay } from "../lib/format";

const X0 = 50, Y0 = 40, W = 740, H = 300; // área de trazado del Figma (escala: 3 px por punto de puntaje)
const y = (score: number) => Y0 + H - 3 * score;

function dayList(days: number): string[] {
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    out.push(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10));
  }
  return out;
}

export function ScoreChart({ history }: { history: ScoreHistory }) {
  const days = dayList(history.days);
  const xOf = (iso: string) => X0 + 12 + (days.indexOf(iso) / (history.days - 1)) * 716;
  const pts = history.points.filter((p) => days.includes(p.date));
  const label7 = history.days === 7;
  const line = pts.map((p) => `${xOf(p.date)},${y(p.score)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg className="score-chart" viewBox="0 0 944 390" role="img" aria-label="Historial del puntaje">
      <rect x={X0} y={Y0} width={W} height={60} fill="#eaf5f3" />
      <rect x={X0} y={Y0 + 60} width={W} height={90} fill="#fcf5df" />
      <rect x={X0} y={Y0 + 150} width={W} height={150} fill="#fcecf0" />
      {[100, 80, 50, 0].map((v) => (
        <g key={v}>
          <line x1={X0} x2={X0 + W} y1={y(v)} y2={y(v)} stroke="#dee4ec" />
          <text x={8} y={y(v) + 4} fontSize="11" fill="#5e6c80">{v}</text>
        </g>
      ))}
      <text x={810} y={72} fontSize="12" fill="#246b67">Bueno 80–100</text>
      <text x={810} y={147} fontSize="12" fill="#805e0e">Regular 50–79</text>
      <text x={810} y={267} fontSize="12" fill="#a52843">Crítico 0–49</text>
      {pts.length > 1 && <polyline points={line} fill="none" stroke="#285fdb" strokeWidth="2" strokeLinejoin="round" />}
      {pts.map((p) => (
        <g key={p.date}>
          <circle cx={xOf(p.date)} cy={y(p.score)} r={4} fill={p.first_review ? "#fff" : "#285fdb"} stroke={p.first_review ? "#5e6c80" : "#285fdb"} strokeWidth="2" />
          {(label7 || p === last || p.first_review) && (
            <text x={xOf(p.date)} y={y(p.score) - 10} fontSize="12" fontWeight="600" fill="#285fdb" textAnchor="middle">{p.score}</text>
          )}
        </g>
      ))}
      {days.map((d, i) => (label7 || i % 5 === 0 || i === days.length - 1) && (
        <text key={d} x={xOf(d)} y={365} fontSize="11" fill="#5e6c80" textAnchor="middle">{fmtDay(d)}</text>
      ))}
    </svg>
  );
}
