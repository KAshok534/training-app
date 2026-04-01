import React from 'react';

export type IconName =
  | 'home' | 'book' | 'user' | 'award' | 'scan'
  | 'play' | 'check' | 'lock' | 'bell' | 'arrow'
  | 'back' | 'video' | 'file' | 'download' | 'star'
  | 'clock' | 'close' | 'wifi' | 'chevron' | 'logout';

interface IconProps { name: IconName; size?: number; color?: string; }

const Icon: React.FC<IconProps> = ({ name, size = 20, color = 'currentColor' }) => {
  const s = {
    width: size, height: size, viewBox: '0 0 24 24' as const,
    fill: 'none' as const, stroke: color, strokeWidth: 2,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  };
  const icons: Record<IconName, React.ReactElement> = {
    home:     <svg {...s}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
    book:     <svg {...s}><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>,
    user:     <svg {...s}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    award:    <svg {...s}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
    scan:     <svg {...s}><polyline points="23,7 23,1 17,1"/><line x1="16" y1="8" x2="23" y2="1"/><polyline points="1,17 1,23 7,23"/><line x1="8" y1="16" x2="1" y2="23"/><polyline points="23,17 23,23 17,23"/><line x1="16" y1="16" x2="23" y2="23"/><polyline points="1,7 1,1 7,1"/><line x1="8" y1="8" x2="1" y2="1"/></svg>,
    play:     <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none"><circle cx="12" cy="12" r="12" opacity="0.15"/><polygon points="10,8 16,12 10,16"/></svg>,
    check:    <svg {...s} strokeWidth={2.5}><polyline points="20,6 9,17 4,12"/></svg>,
    lock:     <svg {...s}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
    bell:     <svg {...s}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
    arrow:    <svg {...s}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/></svg>,
    back:     <svg {...s}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/></svg>,
    video:    <svg {...s}><polygon points="23,7 16,12 23,17"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
    file:     <svg {...s}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>,
    download: <svg {...s}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    star:     <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>,
    clock:    <svg {...s}><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>,
    close:    <svg {...s}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    wifi:     <svg {...s}><path d="M5 12.55a11 11 0 0114.08 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>,
    chevron:  <svg {...s}><polyline points="9,18 15,12 9,6"/></svg>,
    logout:   <svg {...s}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  };
  return icons[name];
};

export default Icon;
