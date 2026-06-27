import { resolveLaunchpadRouterBasename } from "./launchpadEmbedBasename.js";
import { BrowserRouter } from 'react-router-dom';
import { TeevoProvider } from '@/store/TeevoContext';
import { AppRoutes } from '@/routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter basename={resolveLaunchpadRouterBasename()}>
      <TeevoProvider>
        <AppRoutes />
      </TeevoProvider>
    </BrowserRouter>
  );
}
