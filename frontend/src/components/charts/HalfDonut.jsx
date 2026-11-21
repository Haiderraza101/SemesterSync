import { useEffect, useRef, useState } from "react";
import { Cell, Pie, PieChart } from "recharts";

const MAX_WIDTH = 320;
const TRACK_COLOR = "#eef2f6";

function useWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.min(MAX_WIDTH, Math.floor(entry.contentRect.width))));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}

export default function HalfDonut({ segments, value, label, activeIndex = null, onHover, track = false }) {
  const [ref, width] = useWidth();
  const height = Math.round(width / 2);
  const outer = Math.max(0, height - 2);
  const inner = Math.round(outer * 0.76);
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <div ref={ref} className="half-donut">
      {width > 0 && (
        <div className="half-donut__canvas" style={{ width, height }}>
          <PieChart width={width} height={height} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            {(track || total === 0) && (
              <Pie
                data={[{ value: 1 }]}
                dataKey="value"
                cx="50%"
                cy="100%"
                startAngle={180}
                endAngle={0}
                innerRadius={inner}
                outerRadius={outer}
                cornerRadius={10}
                stroke="none"
                isAnimationActive={false}
              >
                <Cell fill={TRACK_COLOR} />
              </Pie>
            )}
            {total > 0 && (
              <Pie
                data={segments}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="100%"
                startAngle={180}
                endAngle={track ? 180 - (180 * Math.min(total, 100)) / 100 : 0}
                innerRadius={inner}
                outerRadius={outer}
                cornerRadius={10}
                paddingAngle={segments.length > 1 ? 1 : 0}
                stroke="#ffffff"
                strokeWidth={segments.length > 1 ? 2 : 0}
                animationDuration={800}
                onMouseEnter={(_, index) => onHover?.(index)}
                onMouseLeave={() => onHover?.(null)}
              >
                {segments.map((segment, index) => (
                  <Cell
                    key={segment.name}
                    fill={segment.color}
                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.35}
                    className="half-donut__segment"
                  />
                ))}
              </Pie>
            )}
          </PieChart>
          <div className="half-donut__center">
            <span className="half-donut__value">{value}</span>
            <span className="half-donut__label">{label}</span>
          </div>
        </div>
      )}
    </div>
  );
}
