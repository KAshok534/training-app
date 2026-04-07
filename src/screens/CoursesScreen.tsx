import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Spinner } from '../components/UI';
import type { Course, CourseMode } from '../types';

type Filter = 'All' | CourseMode;
interface Props { onNavigate:(screen:string, data?:unknown)=>void; }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCourse(row: any): Course {
  return {
    id:        row.id,
    title:     row.title,
    subtitle:  row.subtitle,
    duration:  row.duration,
    fee:       row.fee_inr,
    feeUsd:    row.fee_usd,
    hours:     row.hours,
    seats:     row.seats,
    filled:    row.filled,
    mode:      row.mode,
    startDate: row.start_date,
    badge:     row.badge,
    modules:   row.module_count,
    trainer:   row.trainer,
    category:  row.category,
    color:     row.color,
    icon:      row.icon,
    topics:    row.topics ?? [],
  };
}

function levelLabel(c: Course): string {
  if (c.hours && parseInt(c.hours) >= 150) return 'Advanced';
  if (c.hours && parseInt(c.hours) >= 100) return 'Intermediate';
  return 'Beginner';
}

function levelColor(level: string): string {
  if (level === 'Advanced')     return '#1a3a2a';
  if (level === 'Intermediate') return '#1565c0';
  return '#2d7a4f';
}

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
    <div className="screen">
      {/* Sticky header */}
      <div style={{ background:'var(--forest)', padding:'20px 20px 20px', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ fontFamily:"'Playfair Display', serif", color:'white', fontSize:24, fontWeight:900 }}>
          Training Programs
        </div>
        <div style={{ color:'var(--sage)', fontSize:12, marginTop:2 }}>
          {courses.length > 0 ? `${courses.length} courses · ` : ''}ISO Certified · AIWMR
        </div>
        {/* Filter tabs */}
        <div style={{ display:'flex', gap:8, marginTop:14 }}>
          {(['All','Online','Hybrid'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding:'6px 16px', borderRadius:20, border:'none', cursor:'pointer',
                background: filter === f ? 'var(--leaf)' : 'rgba(255,255,255,0.12)',
                color:      filter === f ? 'var(--forest)' : 'var(--sage)',
                fontSize:13, fontWeight: filter === f ? 700 : 400,
                fontFamily:"'DM Sans', sans-serif", transition:'all 0.2s',
              }}
            >{f}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:'14px 12px 8px' }}>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', paddingTop:60 }}>
            <Spinner size={32} color="var(--forest)" />
          </div>
        ) : (
          <>
            {/* Results count */}
            <div style={{ fontSize:12, color:'#999', marginBottom:12, paddingLeft:2 }}>
              Showing {filtered.length} program{filtered.length !== 1 ? 's' : ''}
            </div>

            {/* 2-column thumbnail grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {filtered.map((c, i) => {
                const level = levelLabel(c);
                const seatsLeft = c.seats - c.filled;
                const fillPct   = Math.round((c.filled / c.seats) * 100);
                return (
                  <div
                    key={c.id}
                    onClick={() => onNavigate('courseDetail', c)}
                    style={{
                      background:'white',
                      borderRadius:14,
                      overflow:'hidden',
                      boxShadow:'0 2px 8px rgba(0,0,0,0.08)',
                      cursor:'pointer',
                      animation:`fadeUp 0.3s ease ${i * 0.05}s both`,
                      display:'flex',
                      flexDirection:'column',
                      border:'1px solid var(--sand)',
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{
                      background: c.color,
                      height:110,
                      position:'relative',
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'center',
                      overflow:'hidden',
                    }}>
                      {/* Decorative circles */}
                      <div style={{ position:'absolute', top:-18, right:-18, width:70, height:70, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }}/>
                      <div style={{ position:'absolute', bottom:-12, left:-12, width:50, height:50, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }}/>
                      {/* Emoji icon */}
                      <div style={{ fontSize:44, position:'relative', zIndex:1 }}>{c.icon}</div>
                      {/* Certificate badge — top right */}
                      <div style={{
                        position:'absolute', top:8, right:8,
                        background:'rgba(255,255,255,0.95)',
                        color: c.color,
                        fontSize:9, fontWeight:800,
                        padding:'3px 7px', borderRadius:20,
                        letterSpacing:'0.5px',
                        fontFamily:"'DM Sans', sans-serif",
                      }}>
                        ✦ CERTIFICATE
                      </div>
                      {/* Level badge — top left */}
                      <div style={{
                        position:'absolute', top:8, left:8,
                        background: levelColor(level),
                        color:'white',
                        fontSize:9, fontWeight:700,
                        padding:'3px 7px', borderRadius:20,
                        fontFamily:"'DM Sans', sans-serif",
                      }}>
                        {level.toUpperCase()}
                      </div>
                    </div>

                    {/* Card body */}
                    <div style={{ padding:'10px 10px 12px', flex:1, display:'flex', flexDirection:'column' }}>
                      {/* Category */}
                      <div style={{ fontSize:10, color:'var(--moss)', fontWeight:700, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.5px' }}>
                        {c.category}
                      </div>

                      {/* Title */}
                      <div style={{
                        fontFamily:"'DM Sans', sans-serif",
                        fontSize:12, fontWeight:700,
                        color:'var(--charcoal)', lineHeight:1.35,
                        marginBottom:8,
                        display:'-webkit-box',
                        WebkitLineClamp:3,
                        WebkitBoxOrient:'vertical' as const,
                        overflow:'hidden',
                        flex:1,
                      }}>
                        {c.title}
                      </div>

                      {/* Duration · Hours */}
                      <div style={{ display:'flex', gap:6, marginBottom:8, flexWrap:'wrap' }}>
                        <span style={{ fontSize:10, color:'#777', background:'var(--mist)', padding:'2px 7px', borderRadius:10 }}>
                          ⏱ {c.hours}
                        </span>
                        <span style={{ fontSize:10, color:'#777', background:'var(--mist)', padding:'2px 7px', borderRadius:10 }}>
                          📅 {c.duration}
                        </span>
                      </div>

                      {/* Seats fill bar */}
                      <div style={{ marginBottom:8 }}>
                        <div style={{ height:3, background:'var(--sand)', borderRadius:2, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${fillPct}%`, background: fillPct > 80 ? 'var(--amber)' : 'var(--leaf)', borderRadius:2 }}/>
                        </div>
                        <div style={{ fontSize:10, color:'#999', marginTop:3 }}>
                          {seatsLeft} seat{seatsLeft !== 1 ? 's' : ''} left
                        </div>
                      </div>

                      {/* Price + CTA */}
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'auto' }}>
                        <div>
                          <div style={{ fontFamily:"'Playfair Display', serif", fontSize:15, fontWeight:900, color:'var(--forest)' }}>
                            ₹{c.fee.toLocaleString()}
                          </div>
                          <div style={{ fontSize:9, color:'#aaa' }}>${c.feeUsd} USD</div>
                        </div>
                        <div style={{
                          background:'var(--forest)', color:'white',
                          fontSize:10, fontWeight:700,
                          padding:'6px 12px', borderRadius:20,
                          fontFamily:"'DM Sans', sans-serif",
                        }}>
                          View →
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div style={{ textAlign:'center', padding:'60px 32px', color:'#aaa' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🔍</div>
                <div style={{ fontSize:15 }}>No programs found</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CoursesScreen;
