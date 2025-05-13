import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/ManageAds.css';
import { API_URL } from '../../../config';

// Add AdActivity component
function AdActivity({ isOpen, onClose, adLocations, onVisibilityChange }) {
  const handleVisibilityChange = (locationId) => {
    onVisibilityChange(locationId); // Call the handler passed from parent
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Ad Activity</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="ad-locations-list">
            {adLocations.filter(loc => loc.id !== 'popup').map(location => (
              <div key={location.id} className="ad-location-item">
                <div className="ad-location-info">
                  <span className="ad-location-name">{location.name}</span>
                </div>
                <div className="ad-location-controls">
                  <button
                    className={`visibility-btn ${location.isVisible ? 'visible' : 'hidden'}`}
                    onClick={() => handleVisibilityChange(location.id)}
                  >
                    {location.isVisible ? 'Hide' : 'View'}
                  </button>
                </div>
              </div>
            ))}
            
            {/* Explicitly add the popup ad entry */}
            <div className="ad-location-item">
              <div className="ad-location-info">
                <span className="ad-location-name">Popup</span>
                <span className="ad-location-desc">
                  (Shows 3 seconds after page load)
                </span>
              </div>
              <div className="ad-location-controls">
                <button
                  className={`visibility-btn ${adLocations.find(loc => loc.id === 'popup')?.isVisible ? 'visible' : 'hidden'}`}
                  onClick={() => {
                    console.log('Popup button clicked');
                    handleVisibilityChange('popup');
                  }}
                >
                  {adLocations.find(loc => loc.id === 'popup')?.isVisible ? 'Hide' : 'View'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add this component for dynamic info fields
function VendorExtraInfo({ onSave, availableAdTypes, vendorId }) {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  
  // Clear fields and fetch ads when the vendor changes
  useEffect(() => {
    const fetchExistingAds = async () => {
      // Reset fields when vendor changes
      setFields([]);
      
      if (!vendorId) return;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        setLoading(true);
        const response = await fetch(`${API_URL}/ads/vendor/${vendorId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const adsData = await response.json();
          
          if (adsData.length > 0) {
            // Transform the data to match our fields format
            const transformedFields = adsData.map(ad => {
              // Try to find the matching ad location ID
              const matchingAdType = availableAdTypes.find(type => 
                // Match by ID first (backwards compatibility)
                type.id === ad.location_id || 
                // Then try to match by name (for locations saved as full names)
                type.name === ad.location_id
              );
              
              return {
                // If we found a matching type, use its ID, otherwise keep the stored location_id
                type: matchingAdType ? matchingAdType.id : ad.location_id,
                code: ad.ad_code,
                // Store the full name for display
                fullName: matchingAdType ? matchingAdType.name : ad.location_id
              };
            });
            
            console.log('Loaded ad fields:', transformedFields);
            setFields(transformedFields);
          }
          // If no ads found, fields will remain empty as set at the beginning
        }
      } catch (error) {
        console.error('Error fetching existing ads:', error);
        setLocalError('Failed to load existing ads');
      } finally {
        setLoading(false);
      }
    };
    
    fetchExistingAds();
  }, [vendorId, availableAdTypes]);

  const handleChange = (idx, key, val) => {
    const updated = [...fields];
    updated[idx][key] = val;
    
    // If changing the type, also update the fullName
    if (key === 'type') {
      const selectedType = availableAdTypes.find(type => type.id === val);
      updated[idx].fullName = selectedType ? selectedType.name : val;
    }
    
    setFields(updated);
  };

  const addField = () => {
    setFields([...fields, { type: '', code: '', fullName: '' }]);
  };

  const removeField = (idx) => {
    const updated = fields.filter((_, i) => i !== idx);
    setFields(updated);
  };

  const validateFields = () => {
    // If there are no fields, that's valid (it means clearing all ads)
    if (fields.length === 0) {
      return true;
    }
    
    // Check if any field has empty type or code
    const invalidField = fields.find(field => !field.type || !field.code);
    if (invalidField) {
      setLocalError('All fields must have both Location and Ad Code values');
      return false;
    }
    
    // Check for duplicate location types
    const types = fields.map(field => field.type);
    const uniqueTypes = new Set(types);
    if (types.length !== uniqueTypes.size) {
      setLocalError('Each ad location can only be used once');
      return false;
    }
    
    setLocalError('');
    return true;
  };

  const handleSave = async () => {
    if (!validateFields()) return;
    
    try {
      setLoading(true);
      // Transform fields to the format expected by the API
      const adEntries = fields.map(field => {
        // Get the selected location's full name if available
        let locationName = field.fullName;
        
        // If fullName is not available, try to get it from the availableAdTypes
        if (!locationName && field.type) {
          const selectedType = availableAdTypes.find(type => type.id === field.type);
          if (selectedType) {
            locationName = selectedType.name;
          } else {
            // Fallback to the type itself if no match is found
            locationName = field.type;
          }
        }
        
        return {
          locationId: locationName,
          adCode: field.code
        };
      });
      
      console.log('Sending ad entries to parent component:', adEntries);
      // If there are no entries, show a confirmation dialog
      if (fields.length === 0) {
        if (!window.confirm('This will remove all ads for this vendor. Continue?')) {
          setLoading(false);
          return;
        }
      }
      
      // Call the onSave function passed from parent with formatted data
      await onSave(adEntries);
      setLocalError('');
    } catch (error) {
      console.error('Error saving ad data:', error);
      setLocalError('Failed to save ad data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner" />;
  }

  return (
    <div className="add-info-section">
      {localError && <div className="error-message">{localError}</div>}
      
      {fields.map((field, idx) => (
        <div key={idx} className="field-group">
          <div className="add-info-row">
            <label className="add-info-label">Location</label>
            <select
              value={field.type || ''}
              onChange={e => handleChange(idx, 'type', e.target.value)}
              className="add-info-select"
            >
              <option value="">Select Ad Location</option>
              {availableAdTypes.map(adType => (
                <option key={adType.id} value={adType.id}>{adType.name}</option>
              ))}
              {/* Add the actual saved value if it doesn't match any available type */}
              {field.type && !availableAdTypes.some(type => type.id === field.type) && (
                <option value={field.type}>{field.fullName || field.type}</option>
              )}
            </select>
            <button 
              type="button" 
              className="delete-field-btn"
              onClick={() => removeField(idx)}
            >
              Delete
            </button>
          </div>
          <div className="add-info-row">
            <label className="add-info-label">Ad Code</label>
            <div className="code-editor-container">
              <textarea
                value={field.code}
                onChange={e => handleChange(idx, 'code', e.target.value)}
                className="code-editor"
                placeholder="Paste the HTML ad code snippet here"
                spellCheck="false"
              />
              <div className="code-editor-line-numbers">
                {field.code.split('\n').map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
            </div>
          </div>
          {field.fullName && field.fullName !== field.type && (
            <div className="add-info-row">
              <label className="add-info-label"></label>
              <div className="selected-location-name">
                Saved location: <strong>{field.fullName}</strong>
              </div>
            </div>
          )}
        </div>
      ))}
      <div className="add-info-actions">
        <button 
          type="button" 
          className="ads-add-btn" 
          onClick={addField}
          disabled={loading}
        >
          Add More
        </button>
        <button 
          type="button" 
          className="ads-add-btn ads-save" 
          onClick={handleSave}
          disabled={loading}
        >
          Save
        </button>
      </div>
    </div>
  );
}

const ManageAds = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [openInfoVendorId, setOpenInfoVendorId] = useState(null);
  const [isAdActivityOpen, setIsAdActivityOpen] = useState(false);

  // Lift the adLocations state here
  const [adLocations, setAdLocations] = useState([
    { id: 'header', name: 'Header Banner', isVisible: true },
    { id: 'left', name: 'Left Banner', isVisible: true },
    { id: 'right', name: 'Right Banner', isVisible: true },
    { id: 'footerLeft', name: 'Footer Square Left', isVisible: true },
    { id: 'footerRight', name: 'Footer Square Right', isVisible: true },
    { id: 'footer', name: 'Footer Banner', isVisible: true },
    { id: 'popup', name: 'Popup', isVisible: true }
  ]);

  // Load/save adLocations from localStorage
  useEffect(() => {
    const defaultLocations = [
      { id: 'header', name: 'Header Banner', isVisible: true },
      { id: 'left', name: 'Left Banner', isVisible: true },
      { id: 'right', name: 'Right Banner', isVisible: true },
      { id: 'footerLeft', name: 'Footer Square Left', isVisible: true },
      { id: 'footerRight', name: 'Footer Square Right', isVisible: true },
      { id: 'footer', name: 'Footer Banner', isVisible: true },
      { id: 'popup', name: 'Popup', isVisible: true } // Ensure default uses 'Popup'
    ];
    
    const savedSettings = localStorage.getItem('adVisibilitySettings');
    if (savedSettings) {
      try {
        const loadedSettings = JSON.parse(savedSettings);
        if (Array.isArray(loadedSettings)) {
          // Ensure all default types exist and names are updated from code defaults
          const mergedSettings = defaultLocations.map(defaultLoc => {
            const loadedLoc = loadedSettings.find(loc => loc.id === defaultLoc.id);
            return {
              ...defaultLoc, // Start with default (ensures correct name)
              // Override visibility if it exists in loaded settings
              isVisible: loadedLoc !== undefined ? loadedLoc.isVisible : defaultLoc.isVisible,
            };
          });

          console.log("Merged settings after loading:", mergedSettings);
          setAdLocations(mergedSettings);
          // Update localStorage with potentially corrected names/structure
          localStorage.setItem('adVisibilitySettings', JSON.stringify(mergedSettings));
        } else {
           throw new Error("Loaded settings are not an array");
        }
      } catch (error) {
        console.error('Error parsing or merging ad settings:', error);
        // If parsing/merging fails, save the clean default settings
        setAdLocations(defaultLocations);
        localStorage.setItem('adVisibilitySettings', JSON.stringify(defaultLocations));
      }
    } else {
       // If no settings exist, save the clean default settings
       setAdLocations(defaultLocations);
       localStorage.setItem('adVisibilitySettings', JSON.stringify(defaultLocations));
    }
  }, []); // Run only once on mount

  // Handler for visibility change, passed to AdActivity
  const handleAdVisibilityChange = (locationId) => {
    setAdLocations(currentLocations => {
      const newLocations = currentLocations.map(location => {
        if (location.id === locationId) {
          return { ...location, isVisible: !location.isVisible };
        }
        return location;
      });
      localStorage.setItem('adVisibilitySettings', JSON.stringify(newLocations));
      console.log('Updated and saved ad visibility settings:', newLocations);
      return newLocations;
    });
  };

  // Define availableAdTypes from the state
  const availableAdTypes = adLocations.map(loc => ({ id: loc.id, name: loc.name }));

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const vendorsResponse = await fetch(`${API_URL}/vendors`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!vendorsResponse.ok) {
        if (vendorsResponse.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        throw new Error('Failed to fetch vendors');
      }

      const vendorsData = await vendorsResponse.json();
      setVendors(vendorsData);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    setIsAuthenticated(true);
    fetchData();
  }, [navigate]);

  const handleDeleteVendor = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) {
      return;
    }

    try {
      console.log('Attempting to delete vendor with ID:', id);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_URL}/vendors/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const responseData = await response.text();
      console.log('Delete vendor response status:', response.status);
      console.log('Delete vendor response data:', responseData);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        throw new Error(`Failed to delete vendor: ${response.status} ${responseData}`);
      }

      // Find vendor name before removing from array
      const deletedVendor = vendors.find(vendor => vendor.id === id);
      const vendorName = deletedVendor ? deletedVendor.name : 'Vendor';

      setVendors(vendors.filter(vendor => vendor.id !== id));
      setError('');
      setSuccess(`Vendor "${vendorName}" deleted successfully!`);
      
      // Clear success message after a few seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
      // Clear selected vendor if it was deleted
      if (selectedVendorId === id) {
        setSelectedVendorId(null);
        setSelectedVendor(null);
      }
    } catch (error) {
      console.error('Error deleting vendor:', error);
      setError(error.message || 'Failed to delete vendor. Please try again later.');
      setSuccess('');
    }
  };

  const handleEditVendor = (id) => {
    navigate(`/edit-vendor/${id}`);
  };

  const handleDelete = async (id) => {
    if (!isAuthenticated) {
      setError('Please login to delete advertisements');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this advertisement?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_URL}/ads/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        throw new Error('Failed to delete advertisement');
      }
      
      setError('');
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Failed to delete advertisement. Please try again later.');
    }
  };

  const handleEdit = (id) => {
    navigate(`/edit-ad/${id}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getFilteredItems = () => {
    return vendors;
  };

  // Save handler for extra info (replace with API call as needed)
  const handleSaveExtraInfo = async (adEntries) => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      if (!selectedVendorId) {
        setError('No vendor selected');
        return;
      }
      
      // Format the request payload exactly as expected by the server
      // Ensure we're using the exact location names provided in the entries
      const payload = {
        vendorId: Number(selectedVendorId), // Ensure it's a number
        adEntries: adEntries ? adEntries.map(entry => ({
          locationId: entry.locationId, // This should already be the full name from VendorExtraInfo
          adCode: entry.adCode
        })) : []
      };
      
      console.log('Saving ads with data:', payload);
      console.log('API URL:', `${API_URL}/ads`);
      
      // First try to ping the server to ensure it's running
      try {
        const pingResponse = await fetch(`${API_URL}/ping`);
        if (pingResponse.ok) {
          console.log('Server ping successful');
        } else {
          console.error('Server ping failed with status:', pingResponse.status);
        }
      } catch (pingError) {
        console.error('Server ping error:', pingError);
      }
      
      // Now try to save the ads
      const response = await fetch(`${API_URL}/ads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      console.log('Server response status:', response.status);
      console.log('Server response status text:', response.statusText);
      
      // Try to get response as text first
      const responseText = await response.text();
      console.log('Raw response text:', responseText);
      
      // Then try to parse as JSON if possible
      let responseData;
      try {
        if (responseText) {
          responseData = JSON.parse(responseText);
          console.log('Parsed response data:', responseData);
        }
      } catch (jsonError) {
        console.error('Failed to parse response as JSON:', jsonError);
      }
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        
        if (response.status === 404) {
          throw new Error('API endpoint not found. Please ensure the server is running and the API endpoint exists.');
        }
        
        const errorMessage = responseData?.details || responseData?.message || responseData?.error || 
          `Failed to save ad data (Status: ${response.status} ${response.statusText})`;
        throw new Error(errorMessage);
      }
      
      const successMessage = adEntries && adEntries.length > 0 
        ? 'Ad entries saved successfully!' 
        : 'All ads cleared successfully for this vendor!';
      
      setSuccess(successMessage);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
    } catch (error) {
      console.error('Error saving ad data:', error);
      setError(error.message || 'Failed to save ad data');
    } finally {
      setLoading(false);
    }
  };

  const EditIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  );

  const DeleteIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18"></path>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  );

  if (loading) {
    return (
      <div className="manage-ads-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="manage-ads-container">
      <div className="manage-ads-header">
        <h1>Manage Advertisements</h1>
        <div className="manage-ads-actions">
          <button className="create-ad-btn" onClick={() => navigate('/create-ad-vendor')}>
            Create New Ad Vendor
          </button>
          <button className="ad-activity-btn" onClick={() => setIsAdActivityOpen(true)}>
            Ad Activity
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="manage-ads-split-layout">
        {/* Left: Vendor List */}
        <aside className="vendor-list-box">
          <h2 className="vendor-list-title">Vendors</h2>
          <div className="vendor-list-scroll">
            {vendors.map(vendor => (
              <div
                key={vendor.id}
                className={`vendor-list-item${String(selectedVendorId) === String(vendor.id) ? ' selected' : ''}`}
                onClick={() => {
                  setSelectedVendorId(vendor.id);
                  setSelectedVendor(vendor);
                }}
              >
                <div className="vendor-list-name">{vendor.name}</div>
                {vendor.email && <div className="vendor-list-email">Email: {vendor.email}</div>}
                <div className="vendor-list-status-row">
                  <div className={`vendor-list-status ${vendor.status.toLowerCase()}`}>{vendor.status}</div>
                  <div className="vendor-actions">
                    <button 
                      className="edit-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditVendor(vendor.id);
                      }}
                      title="Edit vendor"
                    >
                      <EditIcon />
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteVendor(vendor.id);
                      }}
                      title="Delete vendor"
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>
        {/* Right: Add Info UI for selected vendor */}
        <section className="vendor-info-box">
          {selectedVendor ? (
            <div>
              <h2 className="vendor-info-title">Manage Ads for {selectedVendor.name}</h2>
              <VendorExtraInfo 
                onSave={handleSaveExtraInfo} 
                availableAdTypes={availableAdTypes}
                vendorId={selectedVendorId}
              />
            </div>
          ) : (
            <div className="vendor-info-placeholder">Select a vendor to manage their advertisements</div>
          )}
        </section>
      </div>

      <AdActivity 
        isOpen={isAdActivityOpen}
        onClose={() => setIsAdActivityOpen(false)}
        adLocations={adLocations}
        onVisibilityChange={handleAdVisibilityChange}
      />
    </div>
  );
};

export default ManageAds;