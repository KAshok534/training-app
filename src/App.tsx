import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import SplashScreen        from './screens/SplashScreen';
import LoginScreen         from './screens/LoginScreen';
import RegisterScreen      from './screens/RegisterScreen';
import HomeScreen          from './screens/HomeScreen';
import CoursesScreen       from './screens/CoursesScreen';
import CourseDetailScreen  from './screens/CourseDetailScreen';
import LearningScreen      from './screens/LearningScreen';
import ModuleViewerScreen  from './screens/ModuleViewerScreen';
import AssessmentScreen    from './screens/AssessmentScreen';
import AttendanceScreen    from './screens/AttendanceScreen';
import CertificateScreen   from './screens/CertificateScreen';
import AdminSessionScreen   from './screens/AdminSessionScreen';
import AdminStudentsScreen  from './screens/AdminStudentsScreen';
import AdminRewardsScreen   from './screens/AdminRewardsScreen';
import PerformanceScreen    from './screens/PerformanceScreen';
import ResetPasswordScreen  from './screens/ResetPasswordScreen';
import BottomNav            from './components/BottomNav';
import InstallBanner        from './components/InstallBanner';
import DemoBanner           from './components/DemoBanner';
import OfflineBanner        from './components/OfflineBanner';
import ErrorBoundary        from './components/ErrorBoundary';
import type { Course, CourseModule } from './types';

type ScreenId = 'home'|'courses'|'courseDetail'|'learning'|'attendance'|'certificates'|'adminSession'|'adminStudents'|'adminRewards'|'moduleViewer'|'assessment'|'performance';
interface NavState { screen: ScreenId; data?: Course | CourseModule; }

const InnerApp: React.FC = () => {
  const { user, loading, recoveryMode, isDemo } = useAuth();
  const [splash, setSplash]     = useState(true);
  const [authScreen, setAuthScreen] = useState<'login'|'register'>('login');
  const [nav, setNav] = useState<NavState>({ screen:'home' });

  const navigate = (screen: string, data?: unknown) =>
    setNav({ screen: screen as ScreenId, data: data as Course|undefined });

  // Recovery link clicked — show reset form immediately, skip splash entirely
  if (recoveryMode) return <ResetPasswordScreen/>;

  if (splash) return <SplashScreen onDone={()=>setSplash(false)}/>;

  if (loading) return (
    <div style={{ position:'fixed', inset:0, background:'var(--forest)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:32, height:32, border:'3px solid rgba(255,255,255,0.2)', borderTopColor:'var(--leaf)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
    </div>
  );

  if (!user) return (
    <>
      <InstallBanner/>
      {authScreen === 'register'
        ? <RegisterScreen onShowLogin={() => setAuthScreen('login')} />
        : <LoginScreen    onShowRegister={() => setAuthScreen('register')} />}
    </>
  );

  // Map sub-screens back to their parent tab so the bottom nav stays highlighted correctly
  const screenToTab: Record<string, string> = {
    moduleViewer: 'learning',
    assessment:   'learning',
    courseDetail: 'courses',
    performance:  'home',
  };
  const activeTab = screenToTab[nav.screen] ?? nav.screen;

  const renderScreen = () => {
    switch (nav.screen) {
      case 'courseDetail':
        return nav.data ? <CourseDetailScreen course={nav.data as Course} onBack={()=>navigate('courses')} onNavigate={navigate}/> : null;
      case 'courses':
        return <CoursesScreen onNavigate={navigate}/>;
      case 'learning':
        return <LearningScreen onNavigate={navigate}/>;
      case 'moduleViewer':
        return nav.data
          ? <ModuleViewerScreen
              moduleData={nav.data as CourseModule}
              onBack={() => navigate('learning')}
              onStartAssessment={(m) => navigate('assessment', m)}
            />
          : null;
      case 'assessment':
        return nav.data
          ? <AssessmentScreen
              moduleData={nav.data as CourseModule}
              onBack={() => navigate('learning')}
              onRetake={() => navigate('assessment', nav.data)}
            />
          : null;
      case 'attendance':
        return <AttendanceScreen onNavigate={navigate}/>;
      case 'certificates':
        return <CertificateScreen onNavigate={navigate}/>;
      case 'adminSession':
        return <AdminSessionScreen onBack={() => navigate('home')}/>;
      case 'adminStudents':
        return <AdminStudentsScreen onBack={() => navigate('home')}/>;
      case 'adminRewards':
        return <AdminRewardsScreen onBack={() => navigate('home')}/>;
      case 'performance':
        return <PerformanceScreen onNavigate={navigate}/>;
      default:
        return <HomeScreen onNavigate={navigate}/>;
    }
  };

  return (
    <>
      <InstallBanner/>
      <DemoBanner isDemo={isDemo}/>
      {renderScreen()}
      <BottomNav current={activeTab} onChange={navigate} role={user.role}/>
    </>
  );
};

const App: React.FC = () => (
  <ErrorBoundary>
    <OfflineBanner/>
    <AuthProvider><InnerApp/></AuthProvider>
  </ErrorBoundary>
);
export default App;
