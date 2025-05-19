// Default ad settings
const defaultAdSettings = [
  { id: 'header', isVisible: true },
  { id: 'left', isVisible: true },
  { id: 'right', isVisible: true },
  { id: 'popup', isVisible: true },
  { id: 'footer', isVisible: true }
];

// Get ad settings from localStorage or use defaults
export const getAdSettings = () => {
  const savedSettings = localStorage.getItem('adVisibilitySettings');
  if (savedSettings) {
    try {
      return JSON.parse(savedSettings);
    } catch (error) {
      console.error('Error parsing ad settings:', error);
      return defaultAdSettings;
    }
  }
  return defaultAdSettings;
};

// Save ad settings to localStorage
export const saveAdSettings = (settings) => {
  localStorage.setItem('adVisibilitySettings', JSON.stringify(settings));
};

// Subscribe to ad settings changes
let subscribers = [];
export const subscribeToAdSettings = (callback) => {
  subscribers.push(callback);
  return () => {
    subscribers = subscribers.filter(sub => sub !== callback);
  };
};

// Update ad settings
export const updateAdSettings = (newSettings) => {
  saveAdSettings(newSettings);
  subscribers.forEach(callback => callback(newSettings));
};

// Toggle visibility for a specific ad
export const toggleAdVisibility = (adId) => {
  const currentSettings = getAdSettings();
  const newSettings = currentSettings.map(setting => 
    setting.id === adId 
      ? { ...setting, isVisible: !setting.isVisible }
      : setting
  );
  updateAdSettings(newSettings);
  return newSettings;
}; 