import { useEffect, useMemo, useRef, useState } from "react";
import { useWindowWidth } from "../../hooks/useWindowWidth.js";
import {
  COLUMN_MIN_WIDTH,
  HOUR_HEIGHT,
  cardPosition,
  groupByDay,
  hourBounds,
  hourLabel,
  layoutOverlaps,
  minutesOfDay,
  overlapCount,
} from "../../utils/calendarLayout.js";
import { cx } from "../../utils/cx.js";
import { isSameDay, toDateKey } from "../../utils/date.js";
import Icon from "../ui/Icon.jsx";
import EventCard from "./EventCard.jsx";

const DESKTOP_MIN_WIDTH = 1024;
const TABLET_MIN_WIDTH = 768;
const QUARTERS = [0, 15, 30, 45];
const DAY_HEADER = new Intl.DateTimeFormat("en-GB", { weekday: "long" });
const DAY_NUMBER = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const SCROLL_STEP = 240;

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

function chunk(list, size) {
  const chunks = [];
  for (let index = 0; index < list.length; index += size) chunks.push(list.slice(index, index + size));
  return chunks;
}

function DayHeader({ day, today }) {
  return (
    <div className={cx("cal-grid__day-header", today && "cal-grid__day-header--today")}>
      <span className="cal-grid__day-name">{DAY_HEADER.format(day)}</span>
      <span className="cal-grid__day-date">{today ? "Today" : DAY_NUMBER.format(day)}</span>
    </div>
  );
}

function TimeColumn({ hours }) {
  return (
    <div className="cal-grid__times">
      {hours.map((hour) => (
        <div key={hour} className="cal-grid__time" style={{ height: HOUR_HEIGHT }}>
          <span>{hourLabel(hour)}</span>
        </div>
      ))}
    </div>
  );
}

function DayColumn({ day, items, hours, startHour, selectedId, onSelect, now }) {
  const layout = useMemo(() => layoutOverlaps(items), [items]);
  const showNow = isSameDay(day, now);
  const nowOffset = ((minutesOfDay(now) - startHour * 60) * HOUR_HEIGHT) / 60;

  return (
    <div className={cx("cal-grid__column", showNow && "cal-grid__column--today")}>
      {hours.map((hour) => (
        <div key={hour} className="cal-grid__hour" style={{ height: HOUR_HEIGHT }}>
          {QUARTERS.map((minute) => (
            <div key={minute} className={cx("cal-grid__slot", minute % 30 === 0 && "cal-grid__slot--line")} />
          ))}
        </div>
      ))}
      {items.map((item) => {
        const position = cardPosition(item, startHour);
        const slot = layout.get(item.id) || { column: 0, total: 1 };
        const width = 100 / slot.total;
        return (
          <EventCard
            key={item.id}
            item={item}
            height={position.height}
            selected={item.id === selectedId}
            onSelect={onSelect}
            style={{
              top: position.top,
              height: position.height,
              left: `calc(${slot.column * width}% + 2px)`,
              width: `calc(${width}% - 4px)`,
            }}
          />
        );
      })}
      {showNow && nowOffset >= 0 && nowOffset <= hours.length * HOUR_HEIGHT && (
        <div className="cal-grid__now" style={{ top: nowOffset }} aria-hidden="true" />
      )}
    </div>
  );
}

function columnTemplate(days, itemsByDay) {
  const columns = days.map((day) => {
    const needed = overlapCount(itemsByDay.get(toDateKey(day)) || []);
    return `minmax(${needed * COLUMN_MIN_WIDTH}px, ${needed}fr)`;
  });
  return `80px ${columns.join(" ")}`;
}

function GridBody({ days, itemsByDay, hours, startHour, selectedId, onSelect, now, corner, fit = false }) {
  const template = fit ? `80px repeat(${days.length}, minmax(0, 1fr))` : columnTemplate(days, itemsByDay);
  return (
    <div className="cal-grid__table">
      <div className="cal-grid__row cal-grid__row--head" style={{ gridTemplateColumns: template }}>
        <div className="cal-grid__corner">{corner}</div>
        {days.map((day) => (
          <DayHeader key={toDateKey(day)} day={day} today={isSameDay(day, now)} />
        ))}
      </div>
      <div className="cal-grid__row" style={{ gridTemplateColumns: template }}>
        <TimeColumn hours={hours} />
        {days.map((day) => (
          <DayColumn
            key={toDateKey(day)}
            day={day}
            items={itemsByDay.get(toDateKey(day)) || []}
            hours={hours}
            startHour={startHour}
            selectedId={selectedId}
            onSelect={onSelect}
            now={now}
          />
        ))}
      </div>
    </div>
  );
}

function chunkHours(days, itemsByDay, fallback) {
  const chunkItems = days.flatMap((day) => itemsByDay.get(toDateKey(day)) || []);
  if (chunkItems.length === 0) return fallback;
  const first = Math.floor(Math.min(...chunkItems.map((item) => minutesOfDay(item.start))) / 60);
  const startHour = Math.min(first, fallback[fallback.length - 1]);
  const endHour = fallback[fallback.length - 1] + 1;
  return Array.from({ length: endHour - startHour }, (_, index) => startHour + index);
}

function ScrollButtons({ onScroll }) {
  return (
    <div className="cal-grid__corner-actions">
      <button type="button" className="cal-grid__scroll-button" aria-label="Scroll left" onClick={() => onScroll(-1)}>
        <Icon name="chevron-left" size={16} strokeWidth={3} />
      </button>
      <button type="button" className="cal-grid__scroll-button" aria-label="Scroll right" onClick={() => onScroll(1)}>
        <Icon name="chevron-right" size={16} strokeWidth={3} />
      </button>
    </div>
  );
}

function DesktopGrid({ days, ...gridProps }) {
  const scrollRef = useRef(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return undefined;
    const check = () => setOverflowing(element.scrollWidth > element.clientWidth + 1);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(element);
    return () => observer.disconnect();
  }, [days, gridProps.itemsByDay]);

  const scroll = (direction) => scrollRef.current?.scrollBy({ left: direction * SCROLL_STEP, behavior: "smooth" });

  return (
    <div className="cal-grid">
      <div ref={scrollRef} className="cal-grid__scroll scrollbar-premium">
        <GridBody days={days} {...gridProps} fit corner={overflowing ? <ScrollButtons onScroll={scroll} /> : null} />
      </div>
    </div>
  );
}

function ChunkCard({ days, expanded, onToggle, collapsedHeight, hours: allHours, ...gridProps }) {
  const scrollRef = useRef(null);
  const hours = useMemo(() => chunkHours(days, gridProps.itemsByDay, allHours), [days, gridProps.itemsByDay, allHours]);
  const scroll = (direction) => scrollRef.current?.scrollBy({ left: direction * SCROLL_STEP, behavior: "smooth" });

  return (
    <div className="cal-grid cal-grid--chunk">
      <div className="cal-grid__clip" style={expanded ? undefined : { maxHeight: collapsedHeight }}>
        <div ref={scrollRef} className="cal-grid__scroll scrollbar-premium">
          <GridBody
            days={days}
            {...gridProps}
            hours={hours}
            startHour={hours[0]}
            corner={<ScrollButtons onScroll={scroll} />}
          />
        </div>
      </div>
      {!expanded && <div className="cal-grid__fade" aria-hidden="true" />}
      <button type="button" className={cx("cal-grid__expand", expanded && "cal-grid__expand--open")} onClick={onToggle}>
        <span>{expanded ? "Show less" : "Expand full day"}</span>
        <Icon name={expanded ? "chevron-up" : "chevron-down"} size={18} strokeWidth={3} />
      </button>
    </div>
  );
}

export default function TimeGrid({ days, items, selectedId, onSelect }) {
  const width = useWindowWidth();
  const now = useNow();
  const [expanded, setExpanded] = useState(() => new Set());
  const itemsByDay = useMemo(() => groupByDay(items), [items]);
  const { startHour, endHour } = useMemo(() => hourBounds(items), [items]);
  const hours = useMemo(() => Array.from({ length: endHour - startHour }, (_, index) => startHour + index), [startHour, endHour]);
  const gridProps = { itemsByDay, hours, startHour, selectedId, onSelect, now };

  if (width >= DESKTOP_MIN_WIDTH) {
    return <DesktopGrid days={days} {...gridProps} />;
  }

  const tablet = width >= TABLET_MIN_WIDTH;
  const chunks = chunk(days, tablet ? 2 : 1);
  const toggle = (index) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  return (
    <div className="cal-grid__chunks">
      {chunks.map((chunkDays, index) => (
        <ChunkCard
          key={toDateKey(chunkDays[0])}
          days={chunkDays}
          expanded={expanded.has(index)}
          onToggle={() => toggle(index)}
          collapsedHeight={tablet ? 400 : 320}
          {...gridProps}
        />
      ))}
    </div>
  );
}
