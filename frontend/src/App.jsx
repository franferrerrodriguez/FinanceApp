import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthModal } from './components/AuthModal';
import { Layout } from './components/Layout';
import { RequireAuth } from './components/RequireAuth';
import { RequireOnboarding } from './components/RequireOnboarding';
import { AccountPage } from './modules/account/AccountPage';
import { ProfilePage } from './modules/profile/ProfilePage';
import { AuthModalProvider } from './context/AuthModalContext';
import { ToastProvider } from './context/ToastContext';
import { useAppPreferencesSync } from './hooks/useAppPreferencesSync';
import { useCloudAutoSync } from './hooks/useCloudAutoSync';
import { useOnboardingBootstrap } from './hooks/useOnboardingBootstrap';
import { useIneInflationSync } from './hooks/useIneInflationSync';
import { BalancePage } from './modules/balance/BalancePage';
import { DashboardPage } from './modules/dashboard/DashboardPage';
import { OnboardingGate } from './modules/onboarding/OnboardingGate';
import { ProjectionPage } from './modules/projection/ProjectionPage';
import { getOnboardingEntryPath } from './lib/onboardingAccess';
import { useOnboardingState, useProfile, useSettings } from './store/hooks';

function HomeRedirect() {
  const { completed: onboardingCompleted } = useOnboardingState();
  const { settings } = useSettings();
  const { profile } = useProfile();

  if (onboardingCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Navigate to={getOnboardingEntryPath(settings, profile)} replace />
  );
}

function AppRoutes() {
  useAppPreferencesSync();
  useCloudAutoSync();
  useOnboardingBootstrap();
  useIneInflationSync();

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomeRedirect />} />
        <Route path="onboarding/:stepSlug?" element={<OnboardingGate />} />
        <Route
          path="dashboard"
          element={
            <RequireOnboarding>
              <DashboardPage />
            </RequireOnboarding>
          }
        />
        <Route
          path="balance"
          element={
            <RequireOnboarding>
              <BalancePage />
            </RequireOnboarding>
          }
        />
        <Route
          path="projection"
          element={
            <RequireOnboarding>
              <ProjectionPage />
            </RequireOnboarding>
          }
        />
        <Route
          path="profile"
          element={
            <RequireOnboarding>
              <ProfilePage />
            </RequireOnboarding>
          }
        />
        <Route
          path="cuenta"
          element={
            <RequireOnboarding>
              <RequireAuth>
                <AccountPage />
              </RequireAuth>
            </RequireOnboarding>
          }
        />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <ToastProvider>
        <AuthModalProvider>
          <AppRoutes />
          <AuthModal />
        </AuthModalProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
