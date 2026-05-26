/**
 * CoursesScreen — editorial magazine listing of all 15 AIWMR programs.
 *
 * Each course is a numbered editorial entry: small-caps category, Fraunces
 * title, italic price, metadata row, optional course logo on the right.
 */
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import ParchmentBackdrop from '../components/ParchmentBackdrop';
import { DISPLAY, BODY } from '../components/AuthShell';
import type { Course, CourseMode } from '../types';

type Filter = 'All' | CourseMode;
interface Props { onNavigate: (screen: string, data?: unknown) => void; }

// Frontend fallback map — until logo_url column exists in Supabase
const COURSE_LOGO_MAP: Record<number, string> = {
  1: '/course-logos/cewm.png',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCourse(row: any): Course {
  return {
    id: row.id, title: row.title, subtitle: row.subtitle,
    duration: row.duration, fee: row.fee_inr, feeUsd: row.fee_usd,
    hours: row.hours, seats: row.seats, filled: row.filled,
    mode: row.mode, startDate: row.start_date, badge: row.badge,
    modules: row.module_count, trainer: row.trainer, category: row.category,
    color: row.color, icon: row.icon, topics: row.topics ?? [],
    logoUrl: row.logo_url ?? COURSE_LOGO_MAP[row.id as number] ?? undefined,
  };
}

// Roman numerals for course numbering
const toRoman = (n: number): string => {
  const map: [number, string][] = [
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let result = ''; let num = n;
  for (const [val, sym] of map) {
    while (num >= val) { result += sym; num -= val; }
  }
  return result;
};

const CoursesScreen: React.FC<Props> = ({ onNavigate }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<Filter>('All');

  useEffect(() => {
    supabase
      .from('courses')
      .select('*')
      .order('id', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) setCourses(data.map(mapCourse));
        setLoading(false);
      });
  }, []);

  const filtered = filter === 'All' ? courses : courses.filter(c => c.mode === filter);

  return (
    <ParchmentBackdrop decorations="full">
      <div className="screen" style={{ position: 'absolute', inset: 0 }}>
        <div style={{
          maxWidth: 540, margin: '0 auto',
          padding: 'calc(28px + var(--safe-top)) 28px 40px',
        }}>

          {/* ── Editorial header ── */}
          <div style={{
            fontFamily: BODY,
            fontSize: 10, fontWeight: 600,
            color: 'var(--moss)',
            letterSpacing: '0.34em',
            textTransform: 'uppercase',
            marginBottom: 16,
            animation: 'fadeUpSoft 0.5s ease 0.05s both',
          }}>
            — Training Programs
          </div>

          <h1 style={{
            fontFamily: DISPLAY,
            fontSize: 'clamp(42px, 12vw, 64px)',
            color: 'var(--forest)',
            fontWeight: 400,
            lineHeight: 0.96,
            letterSpacing: '-0.022em',
            margin: 0, marginBottom: 14,
            fontVariationSettings: '"opsz" 144, "SOFT" 80',
            animation: 'fadeUpSoft 0.6s ease 0.12s both',
          }}>
            Our<br/>
            <em style={{ fontStyle: 'italic', color: 'var(--moss)', fontWeight: 400 }}>programs.</em>
          </h1>

          <p style={{
            fontFamily: DISPLAY,
            fontStyle: 'italic',
            fontSize: 16,
            color: 'var(--charcoal)',
            opacity: 0.72,
            lineHeight: 1.55,
            margin: 0, marginBottom: 30,
            maxWidth: 420,
            animation: 'fadeUpSoft 0.6s ease 0.2s both',
          }}>
            Fifteen ISO-certified programs in environmental management, waste stewardship & sustainability — led by Dr. Sushanth Gade.
          </p>

          {/* ── Decorative rule ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16, marginBottom: 26,
            animation: 'fadeUpSoft 0.5s ease 0.3s both',
          }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(26,58,42,0.18)' }}/>
            <span style={{ fontFamily: DISPLAY, fontSize: 13, color: 'var(--moss)', opacity: 0.7 }}>✦</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(26,58,42,0.18)' }}/>
          </div>

          {/* ── Filter chips ── */}
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 14,
            marginBottom: 28,
            flexWrap: 'wrap',
            animation: 'fadeUpSoft 0.5s ease 0.35s both',
          }}>
            <span style={{
              fontFamily: BODY,
              fontSize: 9, fontWeight: 700,
              color: 'var(--moss)',
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              opacity: 0.75,
            }}>Filter</span>
            {(['All', 'Online', 'Hybrid'] as Filter[]).map(f => {
              const active = filter === f;
              return (
                <button key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    fontFamily: active ? DISPLAY : BODY,
                    fontSize: active ? 16 : 11,
                    fontStyle: active ? 'italic' : 'normal',
                    fontWeight: active ? 500 : 600,
                    color: active ? 'var(--forest)' : 'rgba(26,58,42,0.5)',
                    letterSpacing: active ? 0 : '0.22em',
                    textTransform: active ? 'none' : 'uppercase',
                    borderBottom: active ? '1.5px solid var(--moss)' : '1.5px solid transparent',
                    paddingBottom: 2,
                    transition: 'all 0.2s ease',
                  }}>
                  {active ? f.toLowerCase() : f}
                </button>
              );
            })}
          </div>

          {/* ── Courses list ── */}
          {loading ? (
            <div style={{
              fontFamily: DISPLAY,
              fontStyle: 'italic',
              fontSize: 14,
              color: 'var(--moss)',
              textAlign: 'center',
              padding: '40px 0',
            }}>
              Loading our programs…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              fontFamily: DISPLAY,
              fontStyle: 'italic',
              fontSize: 15,
              color: 'var(--charcoal)',
              opacity: 0.6,
              textAlign: 'center',
              padding: '40px 0',
            }}>
              No programs match this filter.
            </div>
          ) : (
            <div>
              {filtered.map((c, i) => (
                <CourseEntry
                  key={c.id}
                  course={c}
                  index={i + 1}
                  isFirst={i === 0}
                  onTap={() => onNavigate('courseDetail', c)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </ParchmentBackdrop>
  );
};

// ─── Single course entry ─────────────────────────────────────────────────────

interface CourseEntryProps {
  course: Course;
  index: number;
  isFirst: boolean;
  onTap: () => void;
}

const CourseEntry: React.FC<CourseEntryProps> = ({ course, index, isFirst, onTap }) => {
  const seatsLeft = course.seats - course.filled;
  const roman = toRoman(index).toLowerCase();

  return (
    <div
      onClick={onTap}
      onKeyDown={e => { if (e.key === 'Enter') onTap(); }}
      role="button"
      tabIndex={0}
      style={{
        display: 'flex',
        gap: 18,
        padding: '24px 0',
        borderTop: isFirst ? '1px solid rgba(26,58,42,0.2)' : 'none',
        borderBottom: '1px solid rgba(26,58,42,0.2)',
        cursor: 'pointer',
        position: 'relative',
        animation: `fadeUpSoft 0.5s ease ${0.4 + index * 0.04}s both`,
        transition: 'background 0.2s ease',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.4)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
    >
      {/* Roman numeral */}
      <span style={{
        fontFamily: DISPLAY,
        fontStyle: 'italic',
        fontSize: 18,
        color: course.color,
        minWidth: 32,
        lineHeight: 1.4,
        opacity: 0.85,
        flexShrink: 0,
      }}>
        {roman}.
      </span>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Category eyebrow */}
        <div style={{
          fontFamily: BODY,
          fontSize: 9, fontWeight: 700,
          color: course.color,
          letterSpacing: '0.34em',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}>
          {course.category}
        </div>

        {/* Title */}
        <h2 style={{
          fontFamily: DISPLAY,
          fontSize: 'clamp(20px, 5vw, 24px)',
          color: 'var(--forest)',
          fontWeight: 400,
          lineHeight: 1.2,
          letterSpacing: '-0.012em',
          margin: 0, marginBottom: 10,
        }}>
          {course.title}
          <span style={{ color: 'var(--moss)', fontStyle: 'italic' }}>.</span>
        </h2>

        {/* Subtitle */}
        <p style={{
          fontFamily: DISPLAY,
          fontStyle: 'italic',
          fontSize: 13,
          color: 'var(--charcoal)',
          opacity: 0.55,
          lineHeight: 1.4,
          margin: '0 0 14px',
        }}>
          {course.subtitle}
        </p>

        {/* Metadata row */}
        <div style={{
          fontFamily: BODY,
          fontSize: 10, fontWeight: 600,
          color: 'var(--moss)',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          lineHeight: 1.8,
        }}>
          {course.hours}
          {' · '}
          {course.duration}
          {' · '}
          <span style={{ color: seatsLeft <= 3 ? 'var(--red)' : 'var(--moss)' }}>
            {seatsLeft} seat{seatsLeft === 1 ? '' : 's'}
          </span>
          {' · '}
          {course.mode}
        </div>

        {/* Price + CTA row */}
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginTop: 14,
          gap: 14,
        }}>
          <div>
            <span style={{
              fontFamily: DISPLAY,
              fontStyle: 'italic',
              fontSize: 24,
              color: 'var(--forest)',
              fontWeight: 500,
              letterSpacing: '-0.015em',
            }}>
              ₹{course.fee.toLocaleString()}
            </span>
            <span style={{
              fontFamily: BODY,
              fontSize: 10, fontWeight: 600,
              color: 'var(--moss)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginLeft: 8,
              opacity: 0.7,
            }}>
              · ${course.feeUsd} USD
            </span>
          </div>
          <span style={{
            fontFamily: DISPLAY,
            fontStyle: 'italic',
            fontSize: 14,
            color: 'var(--moss)',
            textDecoration: 'underline',
            textDecorationStyle: 'dotted',
            textUnderlineOffset: '4px',
            whiteSpace: 'nowrap',
          }}>
            view course →
          </span>
        </div>
      </div>

      {/* Logo / icon */}
      <div style={{
        flexShrink: 0,
        width: 64,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {course.logoUrl ? (
          <img
            src={course.logoUrl}
            alt={course.title}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              opacity: 0.92,
            }}
          />
        ) : (
          <span style={{
            fontSize: 40,
            opacity: 0.7,
          }}>
            {course.icon}
          </span>
        )}
      </div>
    </div>
  );
};

export default CoursesScreen;
