const getApiUrl = () => {
  const currentEnv = process.env.REACT_APP_CURRENT_ENV || 'dev';
  
  if (currentEnv === 'prod') {
    // Get the current hostname (will be either IP or domain)
    const hostname = window.location.hostname;
    const port = process.env.REACT_APP_API_PORT || 5001;
    
    // If hostname is an IP address (contains numbers and dots)
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return `http://${hostname}:${port}/api`;
    }
    
    // If hostname is a domain name
    return `http://${hostname}/api`;
  }
  
  // In development, use localhost
  return 'http://localhost:5001/api';
};

export const API_URL = getApiUrl(); 