import React from 'react';
import Icon, { IconName } from './Icon';

interface Tab { id: string; icon: IconName; label: string; }
interface Props { current: string; onChange: (id: string)=>void; }

const TABS: Tab[] = [
  { id:'home',         icon:'home',  label:'Home'       },
  { id:'courses',      icon:'book',  label:'Courses'    },
  { id:'learning',     icon:'play',  label:'Learning'   },
  { id:'attendance',   icon:'scan',  label:'Attendance' },
  { id:'certificates', icon:'award', label:'Certs'      },
];

const BottomNav: React.FC<Props> = ({ current, onChange }) => (
  <nav className="bottom-nav" style={{
    background:'var(--white)', borderTop:'1px solid var(--sand)',
    display:'flex', boxShadow:'0 -2px 12px rgba(0,0,0,0.06)',
  }}>
    {TABS.map(t => {
      const active = current === t.id;
      return (
        <button key={t.id} onClick={()=>onChange(t.id)} style={{
          flex:1, display:'flex', flexDirection:'column', alignItems:'center',
          gap: 3, border:'none', background:'none', cursor:'pointer', padding:'10px 0',
          color: active?'var(--forest)':'#bbb', transition:'color 0.2s',
        }}>
          <div style={{ transform: active?'translateY(-1px)':'none', transition:'transform 0.2s' }}>
            <Icon name={t.icon} size={22} color={active?'var(--forest)':'#bbb'}/>
          </div>
          <span style={{ fontSize:10, fontWeight: active?700:400, letterSpacing:'0.02em', lineHeight:1 }}>{t.label}</span>
        </button>
      );
    })}
  </nav>
);

export default BottomNav;
