import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/CreateAdVendor.css';
import { API_URL } from '../../../config';

const CreateAdVendor = () => {
  const navigate = useNavigate();
  const [vendorName, setVendorName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('active');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    if (!vendorName.trim()) {
      setError('Vendor name is required');
      return false;
    }
    
    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address');
        return false;
      }
    }

    if (phone.trim() && !/^\+?[\d\s-]{10,}$/.test(phone)) {
      setError('Please enter a valid phone number');
      return false;
    }

    return true;
  };

  const resetForm = () => {
    setVendorName('');
    setEmail('');
    setPhone('');
    setStatus('active');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const requestData = { 
        name: vendorName.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        status
      };
      
      console.log('Submitting vendor data:', requestData);
      console.log('API endpoint:', `${API_URL}/vendors`);

      const response = await fetch(`${API_URL}/vendors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      console.log('Response status:', response.status);
      
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        
        if (response.status === 409) {
          setError(responseData.details || 'A vendor with this email already exists');
          return;
        }
        
        if (responseData.error) {
          setError(responseData.details || responseData.error || 'Failed to create vendor');
          return;
        }
        
        throw new Error(responseData.message || 'Failed to create vendor');
      }
      
      // Set success state and reset form
      setSuccess(true);
      resetForm();
      
      // Navigate after a short delay
      setTimeout(() => {
        navigate('/manage-ads');
      }, 1500);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Failed to create vendor. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-vendor-container">
      <div className="create-vendor-box">
        <header className="create-vendor-header">
          <h1>Add Advertisement Vendor</h1>
          <p>Enter vendor details below</p>
        </header>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">Vendor created successfully!</div>}

        <form className="create-vendor-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="vendorName">Vendor Name *</label>
            <input
              type="text"
              id="vendorName"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="Enter vendor name"
              required
              maxLength={255}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              maxLength={255}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
              maxLength={20}
            />
          </div>

          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate('/manage-ads')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? <div className="loading-spinner" /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAdVendor; 