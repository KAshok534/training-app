import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import SplashScreen       from './screens/SplashScreen';
import LoginScreen        from './screens/LoginScreen';
import RegisterScreen     from './screens/RegisterScreen';
import HomeScreen         from './screens/HomeScreen';
import CoursesScreen      from './screens/CoursesScreen';
import CourseDetailScreen from './screens/CourseDetailScreen';
import LearningScreen     from './screens/LearningScreen';
import AttendanceScreen   from './screens/AttendanceScreen';
import CertificateScreen  from './screens/CertificateScreen';
import BottomNav          from './components/BottomNav';
import InstallBanner      from './components/InstallBanner';
import DemoBanner         from './components/DemoBanner';
import type { Course }    from './types';

type ScreenId = 'home'|'courses'|'courseDetail'|'learning'|'attendance'|'certificates';
interface NavState { screen: ScreenId; data?: Course; }

const InnerApp: React.FC = () => {
  const { user, loading, isDemo } = useAuth();
  const [splash, setSplash]     = useState(true);
  const [authScreen, setAuthScreen] = useState<'login'|'register'>('login');
  const [nav, setNav] = useState<NavState>({ screen:'home' });

  const navigate = (screen: string, data?: unknown) =>
    setNav({ screen: screen as ScreenId, data: data as Course|undefined });

  if (splash) return <SplashScreen onDone={()=>setSplash(false)}/>;

  if (loading) return (
    <div style={{ position:'fixed', inset:0, background:'var(--forest)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:32, height:32, border:'3px solid rgba(255,255,255,0.2)', borderTopColor:'var(--leaf)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
    </div>
  );

  if (!user) return authScreen === 'register'
    ? <RegisterScreen onShowLogin={() => setAuthScreen('login')} />
    : <LoginScreen    onShowRegister={() => setAuthScreen('register')} />;

  const activeTab = nav.screen==='courseDetail'?'courses':nav.screen;

  const renderScreen = () => {
    switch (nav.screen) {
      case 'courseDetail':  return nav.data ? <CourseDetailScreen course={nav.data} onBack={()=>navigate('courses')} onNavigate={navigate}/> : null;
      case 'courses':       return <CoursesScreen onNavigate={navigate}/>;
      case 'learning':      return <LearningScreen/>;
      case 'attendance':    return <AttendanceScreen/>;
      case 'certificates':  return <CertificateScreen/>;
      default:              return <HomeScreen onNavigate={navigate}/>;
    }
  };

  return (
    <>
      <InstallBanner/>
      <DemoBanner isDemo={isDemo}/>
      {renderScreen()}
      <BottomNav current={activeTab} onChange={navigate}/>
    </>
  );
};

const App: React.FC = () => (
  <AuthProvider><InnerApp/></AuthProvider>
);
export default App;
