import { setupIonicReact } from '@ionic/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProviders } from './components/AppProviders.jsx';
import './i18n';
import '@ionic/react/css/core.css';
import './index.css';

setupIonicReact();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProviders />
  </StrictMode>,
);
