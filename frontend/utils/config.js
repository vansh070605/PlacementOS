export const getBackendUrl = () => {
  const isLocalHost = () => {
    const hostname = window.location.hostname;
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.')
    );
  };

  try {
    const saved = localStorage.getItem('placementos_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.backendUrl) {
        const url = parsed.backendUrl.replace(/\/$/, '');
        const isUrlLocal = (
          url.includes('localhost') ||
          url.includes('127.0.0.1') ||
          url.includes('192.168.') ||
          url.includes('10.') ||
          url.includes('172.')
        );
        // If hosted in production, ignore local localStorage backend URL defaults
        if (isLocalHost() || !isUrlLocal) {
          return url;
        }
      }
    }
  } catch (e) {
    console.error(e);
  }
  
  // Default fallback
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  
  const hostname = window.location.hostname || 'localhost';
  return `http://${hostname}:8000`;
};

