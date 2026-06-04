export const getBackendUrl = () => {
  try {
    const saved = localStorage.getItem('placementos_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.backendUrl) {
        // Strip trailing slash if present
        return parsed.backendUrl.replace(/\/$/, '');
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
