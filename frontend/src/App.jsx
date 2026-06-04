import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthModal } from './components/AuthModal';
import { Layout } from './components/Layout';
import { RequireAuth } from './components/RequireAuth';
import { RequireOnboarding } from './components/RequireOnboarding';
import { AccountPage } from './modules/account/AccountPage';
import { AuthModalProvider } from './context/AuthModalContext';
import { useAppPreferencesSync } from './hooks/useAppPreferencesSync';
import { BalancePage } from './modules/balance/BalancePage';
import { DashboardPage } from './modules/dashboard/DashboardPage';
import { OnboardingGate } from './modules/onboarding/OnboardingGate';
import { ProjectionPage } from './modules/projection/ProjectionPage';
import { useOnboardingState } from './store/hooks';

function HomeRedirect() {
  const { completed: onboardingCompleted } = useOnboardingState();
  return (
    <Navigate to={onboardingCompleted ? '/dashboard' : '/onboarding'} replace />
  );
}

function AppRoutes() {
  useAppPreferencesSync();

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
    <BrowserRouter>
      <AuthModalProvider>
        <AppRoutes />
        <AuthModal />
      </AuthModalProvider>
    </BrowserRouter>
  );
}
