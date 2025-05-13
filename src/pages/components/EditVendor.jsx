import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../css/CreateAdVendor.css';
import { API_URL } from '../../../config';

const EditVendor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [vendorName, setVendorName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('active');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`${API_URL}/vendors/${id}`, {
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
          throw new Error('Failed to fetch vendor details');
        }

        const vendorData = await response.json();
        setVendorName(vendorData.name);
        setEmail(vendorData.email || '');
        setPhone(vendorData.phone || '');
        setStatus(vendorData.status);
      } catch (error) {
        console.error('Error:', error);
        setError(error.message || 'Failed to load vendor details');
      }
    };

    fetchVendor();
  }, [id, navigate]);

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

      const response = await fetch(`${API_URL}/vendors/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        
        if (response.status === 409) {
          setError('A vendor with this email already exists');
          return;
        }
        
        throw new Error('Failed to update vendor');
      }
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/manage-ads');
      }, 1500);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Failed to update vendor. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-vendor-container">
      <div className="create-vendor-box">
        <header className="create-vendor-header">
          <h1>Edit Advertisement Vendor</h1>
          <p>Update vendor details below</p>
        </header>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">Vendor updated successfully!</div>}

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
              {loading ? <div className="loading-spinner" /> : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditVendor; 