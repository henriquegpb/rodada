"use client";

// O seletor de dia do Ranking, o mesmo da aba Recordings da Nora (web, DaySelector). O dia é o
// próprio botão: abre o mês num clique, e as setas ao lado andam um dia por vez.
//
// O mês desce com o desfoque que assenta, um destaque só que desliza até o dia sob o mouse e o mês
// novo entrando pelo lado de onde veio. Os dias em que você jogou ganham um ponto e ficam em branco
// cheio; os outros recuam. Antes da estreia do Rodada e depois de hoje não há o que escolher.

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { addDays } from "@/lib/daily/date";
import { t } from "@/lib/i18n";
import "./day-picker.css";

const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTH_LABEL = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
const DAY_LABEL = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long" });

function parseDateKey(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** "Hoje, 3 de novembro", "Ontem, 2 de novembro" ou só "1 de novembro". */
function formatDateHeading(value: string, today: string): string {
  const label = DAY_LABEL.format(parseDateKey(value));
  if (value === today) return `${t.dayPicker.today}, ${label}`;
  if (value === addDays(today, -1)) return `${t.dayPicker.yesterday}, ${label}`;
  return label;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export function DayPicker({
  value,
  today,
  min,
  marked,
  onChange,
}: {
  value: string;
  /** Hoje em Brasília (`useToday`): o último dia que dá para escolher. */
  today: string;
  /** O primeiro dia que dá para escolher. */
  min: string;
  /** Dias com ponto: os dias em que você jogou. */
  marked: ReadonlySet<string>;
  onChange: (value: string) => void;
}) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const selectedDate = useMemo(() => parseDateKey(value), [value]);
  const [visibleMonth, setVisibleMonth] = useState(() => getMonthStart(selectedDate));
  /** Para que lado o mês andou por último: o novo chega desse lado. */
  const [monthDirection, setMonthDirection] = useState<-1 | 0 | 1>(0);
  const [cursor, setCursor] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const monthKey = toDateKey(visibleMonth).slice(0, 7);

  // Fecha com um clique fora e com Esc, voltando para o dia de onde abriu.
  useEffect(() => {
    if (!isCalendarOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsCalendarOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsCalendarOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isCalendarOpen]);

  const selectedLabel = formatDateHeading(value, today);
  const canGoBack = value > min;
  const canGoForward = value < today;

  const step = (days: number) => {
    const next = addDays(value, days);
    setVisibleMonth(getMonthStart(parseDateKey(next)));
    onChange(next);
  };

  const handleDateSelect = (dateValue: string) => {
    setVisibleMonth(getMonthStart(parseDateKey(dateValue)));
    onChange(dateValue);
    setIsCalendarOpen(false);
  };

  const toggleCalendar = () => {
    if (!isCalendarOpen) {
      setVisibleMonth(getMonthStart(selectedDate));
      setMonthDirection(0);
    }
    setIsCalendarOpen((open) => !open);
  };

  const canGoToNextMonth = monthKey < today.slice(0, 7);
  const canGoToPreviousMonth = monthKey > min.slice(0, 7);

  const moveMonth = (delta: -1 | 1) => {
    if (delta === 1 && !canGoToNextMonth) return;
    if (delta === -1 && !canGoToPreviousMonth) return;
    setMonthDirection(delta);
    setCursor((state) => ({ ...state, visible: false }));
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const lastDayOfMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0);
    const leadingDays = firstDayOfMonth.getDay();
    const totalCells = Math.ceil((leadingDays + lastDayOfMonth.getDate()) / 7) * 7;

    return Array.from({ length: totalCells }, (_, index) => {
      const date = new Date(firstDayOfMonth);
      date.setDate(index - leadingDays + 1);
      const iso = toDateKey(date);
      return {
        iso,
        dayNumber: date.getDate(),
        played: marked.has(iso),
        isCurrentMonth: date.getMonth() === visibleMonth.getMonth(),
        isOutOfRange: iso > today || iso < min,
        isSelected: iso === value,
        isToday: iso === today,
      };
    });
  }, [marked, min, today, value, visibleMonth]);

  const point = (element: HTMLElement) => setCursor({ x: element.offsetLeft, y: element.offsetTop, visible: true });

  return (
    <div className="day-selector-row" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="day-selector-trigger"
        onClick={toggleCalendar}
        aria-haspopup="dialog"
        aria-expanded={isCalendarOpen}
        aria-label={`${selectedLabel}. ${t.dayPicker.choose}`}
      >
        {/* Com a chave no dia, o dia novo entra desfocando em vez de trocar seco. */}
        <span key={value} className="day-selector-label">
          {selectedLabel}
        </span>
        <ChevronDown size={16} className="day-selector-caret" aria-hidden="true" />
      </button>

      <div className="day-selector">
        <button
          type="button"
          className="day-selector-nav"
          onClick={() => step(-1)}
          disabled={!canGoBack}
          aria-label={t.dayPicker.previousDay}
        >
          <ChevronLeft size={17} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="day-selector-nav"
          onClick={() => step(1)}
          disabled={!canGoForward}
          aria-label={t.dayPicker.nextDay}
        >
          <ChevronRight size={17} aria-hidden="true" />
        </button>
      </div>

      {/* Montado também fechado, para o fechar ter animação; o inert tira do alcance. */}
      <div
        className="day-selector-calendar-dropdown"
        data-open={isCalendarOpen || undefined}
        inert={!isCalendarOpen}
        role="dialog"
        aria-label={t.dayPicker.choose}
      >
        <div className="day-selector-calendar-header">
          <button
            type="button"
            className="day-selector-calendar-month-nav"
            onClick={() => moveMonth(-1)}
            disabled={!canGoToPreviousMonth}
            aria-label={t.dayPicker.previousMonth}
          >
            <ChevronLeft size={16} />
          </button>
          <span key={monthKey} className="day-selector-calendar-month-label" data-dir={monthDirection}>
            {capitalize(MONTH_LABEL.format(visibleMonth))}
          </span>
          <button
            type="button"
            className="day-selector-calendar-month-nav"
            onClick={() => moveMonth(1)}
            disabled={!canGoToNextMonth}
            aria-label={t.dayPicker.nextMonth}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="day-selector-calendar-weekdays" aria-hidden="true">
          {WEEKDAY_LABELS.map((label, index) => (
            <span key={index} className="day-selector-calendar-weekday">
              {label}
            </span>
          ))}
        </div>

        <div
          key={monthKey}
          className="day-selector-calendar-grid"
          data-dir={monthDirection}
          onMouseLeave={() => setCursor((state) => ({ ...state, visible: false }))}
        >
          <span
            className="day-selector-calendar-cursor"
            data-visible={cursor.visible || undefined}
            style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
            aria-hidden="true"
          />
          {calendarDays.map((day) => (
            <button
              key={day.iso}
              type="button"
              className={[
                "day-selector-calendar-day",
                day.isSelected ? "day-selector-calendar-day--selected" : "",
                !day.isCurrentMonth ? "day-selector-calendar-day--outside" : "",
                day.isToday ? "day-selector-calendar-day--today" : "",
                day.played ? "day-selector-calendar-day--has-entries" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-label={day.played ? `${day.iso}, ${t.dayPicker.played}` : day.iso}
              aria-current={day.isSelected ? "date" : undefined}
              onMouseEnter={(event) => !day.isOutOfRange && point(event.currentTarget)}
              onFocus={(event) => point(event.currentTarget)}
              onClick={() => handleDateSelect(day.iso)}
              disabled={day.isOutOfRange}
            >
              <span>{day.dayNumber}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
