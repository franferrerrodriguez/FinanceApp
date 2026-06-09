import { useAuthBootstrap } from '../hooks/useAuthBootstrap';
import App from '../App.jsx';
import { StoreHydrationGate } from './StoreHydrationGate.jsx';

/** Start auth before the gate so session bootstrap is not blocked. */
export function AppProviders() {
  useAuthBootstrap();

  return (
    <StoreHydrationGate>
      <App />
    </StoreHydrationGate>
  );
}
