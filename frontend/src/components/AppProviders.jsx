import { useAuthBootstrap } from '../hooks/useAuthBootstrap';
import { useCapacitorShell } from '../hooks/useCapacitorShell';
import App from '../App.jsx';
import { NativeStorageBootstrap } from './NativeStorageBootstrap.jsx';
import { StoreHydrationGate } from './StoreHydrationGate.jsx';

/** Start auth before the gate so session bootstrap is not blocked. */
export function AppProviders() {
  useAuthBootstrap();
  useCapacitorShell();

  return (
    <NativeStorageBootstrap>
      <StoreHydrationGate>
        <App />
      </StoreHydrationGate>
    </NativeStorageBootstrap>
  );
}
