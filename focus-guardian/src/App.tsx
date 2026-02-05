import { useState, useEffect } from 'react'
import TrayWindow from './components/TrayWindow'
import QueueWindow from './components/QueueWindow'
import SettingsWindow from './components/SettingsWindow'
import { useFocusStore } from './store/focus-store'

function App() {
  const [route, setRoute] = useState('/')
  const setStatus = useFocusStore((state) => state.setStatus)

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash.slice(1) || '/');
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Listen for focus updates from main process
  useEffect(() => {
    console.log('Setting up focus update listener...');

    window.electronAPI.onFocusUpdate((status) => {
      console.log('Received focus update:', status);
      setStatus(status);
    });

    // Load initial status
    window.electronAPI.getFocusStatus().then((status) => {
      console.log('Initial focus status:', status);
      setStatus(status);
    });
  }, [setStatus]);

  if (route === '/tray') return <TrayWindow />;
  if (route === '/queue') return <QueueWindow />;
  if (route === '/settings') return <SettingsWindow />;

  return <TrayWindow />;
}

export default App
