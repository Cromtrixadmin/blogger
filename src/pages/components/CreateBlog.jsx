import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../css/CreateBlog.css';
import { API_URL } from '../../../config';

const CreateBlog = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [shortDescription, setShortDescription] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [containerFocused, setContainerFocused] = useState(false);
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  
  const categoryContainerRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const vendorDropdownRef = useRef(null);
  const categoryInputRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get authentication token
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Fetch categories
        const categoriesResponse = await fetch(`${API_URL}/categories`);
        if (!categoriesResponse.ok) throw new Error('Failed to fetch categories');
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);

        // Fetch vendors with authentication
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
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again later.');
      }
    };

    fetchData();
    
    // Add event listener for clicks outside the category list
    const handleClickOutside = (event) => {
      if (categoryContainerRef.current && !categoryContainerRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(event.target)) {
        setShowVendorDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryInputRef.current && !categoryInputRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle category selection
  const handleCategorySelect = (category) => {
    if (!selectedCategories.includes(category)) {
      setSelectedCategories([...selectedCategories, category]);
    }
    setSearchTerm('');
    setShowCategoryDropdown(false);
  };
  
  // Handle category removal
  const handleRemoveCategory = (categoryToRemove) => {
    setSelectedCategories(selectedCategories.filter(category => category !== categoryToRemove));
    setShowCategoryDropdown(false);
  };
  
  // Filter categories based on search term without an input element
  const filteredCategories = searchTerm 
    ? categories.filter(category => 
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !selectedCategories.includes(category.name))
    : categories.filter(category => !selectedCategories.includes(category.name));

  // Handle keyboard input for searching without an input element
  const handleKeyDown = (e) => {
    // Ignore special keys like shift, ctrl, alt, etc.
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    
    // Handle backspace to remove the last character or last category
    if (e.key === 'Backspace') {
      if (searchTerm) {
        setSearchTerm(prev => prev.slice(0, -1));
      } else if (selectedCategories.length > 0) {
        handleRemoveCategory(selectedCategories[selectedCategories.length - 1]);
      }
      return;
    }
    
    // Handle escape to close dropdown
    if (e.key === 'Escape') {
      setShowCategoryDropdown(false);
      return;
    }

    // Handle arrow keys for navigation
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); // Prevent page scrolling
      return;
    }

    // Handle enter to select the first option
    if (e.key === 'Enter' && filteredCategories.length > 0) {
      handleCategorySelect(filteredCategories[0].name);
      return;
    }
    
    // Ignore other special keys
    if (e.key.length > 1) return;

    // Append the character to the search term
    setSearchTerm(prev => prev + e.key);
    setShowCategoryDropdown(true);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Auto-clear search term after 1.5 seconds of inactivity
    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm('');
    }, 1500);
  };

  const handleVendorSelect = (vendor) => {
    console.log('Vendor selected:', vendor);
    // Convert ID to number if it's a string
    const vendorId = typeof vendor.id === 'string' ? parseInt(vendor.id, 10) : vendor.id;
    setSelectedVendor(vendorId);
    console.log('Selected vendor ID set to:', vendorId, 'Type:', typeof vendorId);
    setShowVendorDropdown(false);
  };

  // Quill editor modules configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub' }, { 'script': 'super' }],
      ['blockquote', 'code-block'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false
    }
  };

  // Quill editor formats configuration
  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'blockquote', 'code-block',
    'list', 'bullet', 'indent',
    'direction', 'align',
    'link', 'image', 'video'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submission started');
    console.log('----- FORM DATA DEBUG -----');
    console.log('Title:', title);
    console.log('Author:', author);
    console.log('Categories:', selectedCategories);
    console.log('Short Description:', shortDescription);
    console.log('Short Description Length:', shortDescription ? shortDescription.length : 0);
    console.log('Content Length:', content ? content.length : 0);
    console.log('Selected Vendor:', selectedVendor);
    console.log('Selected Vendor Type:', typeof selectedVendor);
    console.log('--------------------------');
    
    if (!title.trim() || !author.trim() || selectedCategories.length === 0 || !content.trim() || !shortDescription.trim()) {
      console.log('Validation failed: missing required fields');
      setError('Please fill in all fields and select at least one category');
      setSuccess('');
      return;
    }

    // Validate vendor selection
    if (!selectedVendor) {
      console.log('Validation failed: missing vendor selection');
      setError('Please select an Ad Source');
      setSuccess('');
      return;
    }

    // Parse vendor_id as number and validate
    const vendorId = parseInt(selectedVendor, 10);
    if (isNaN(vendorId) || vendorId <= 0) {
      console.log('Validation failed: invalid vendor ID', selectedVendor);
      setError('Invalid Ad Source selected');
      setSuccess('');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, redirecting to login');
        navigate('/login');
        return;
      }

      // Debug log of what we're sending
      const blogData = { 
        title, 
        author, 
        categories: selectedCategories,
        shortDescription: shortDescription.trim(),
        content,
        vendor_id: vendorId // Ensure vendor_id is a number
      };
      console.log('Full blog data being sent:', JSON.stringify(blogData, null, 2));
      console.log('vendor_id:', blogData.vendor_id, 'type:', typeof blogData.vendor_id);
      console.log('shortDescription:', blogData.shortDescription?.substring(0, 30), 'length:', blogData.shortDescription?.length);

      console.log('Sending request to API:', `${API_URL}/blogs`);
      const response = await fetch(`${API_URL}/blogs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(blogData)
      });

      console.log('API response status:', response.status);
      
      try {
        const responseText = await response.text();
        console.log('API response text:', responseText);
        
        if (!response.ok) {
          if (response.status === 401) {
            console.log('Authentication failed (401), redirecting to login');
            localStorage.removeItem('token');
            navigate('/login');
            return;
          }
          
          let errorMessage;
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorData.error || errorData.details || 'Failed to create blog';
          } catch (e) {
            errorMessage = responseText || 'Failed to create blog';
          }
          
          throw new Error(errorMessage);
        }
        
        let responseData;
        try {
          responseData = JSON.parse(responseText);
          console.log('API response data:', responseData);
        } catch (e) {
          console.log('Could not parse response as JSON');
        }
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
      }
      
      // Show success message before redirecting
      setSuccess('Blog post created successfully!');
      
      // Clear the form
      setTitle('');
      setAuthor('');
      setSelectedCategories([]);
      setShortDescription('');
      setContent('');
      setSelectedVendor('');
      
      // Navigate after a short delay
      setTimeout(() => {
        navigate('/admin');
      }, 2000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setError(error.message || 'Failed to create blog. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin');
  };

  return (
    <div className="create-blog-container">
      <div className="create-blog-box">
        <header className="create-blog-header">
          <h1 className="create-blog-title">Create New Blog Post</h1>
          <p className="create-blog-subtitle">Share your thoughts with the world</p>
        </header>

        {error && <div className="blog-error-message">{error}</div>}
        {success && <div className="blog-success-message">{success}</div>}

        <form className="create-blog-form" onSubmit={handleSubmit}>
          <div className="blog-form-group">
            <label htmlFor="title" className="blog-form-label">Title</label>
            <input
              type="text"
              id="title"
              className="blog-form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your blog title"
              required
            />
          </div>

          <div className="blog-form-group">
            <label htmlFor="author" className="blog-form-label">Author</label>
            <input
              type="text"
              id="author"
              className="blog-form-input"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Enter author name"
              required
            />
          </div>

          <div className="blog-form-group">
            <label htmlFor="categories" className="blog-form-label">Categories</label>
            <div className="category-input-container" ref={categoryInputRef} onClick={() => setShowCategoryDropdown(true)}>
              <div className="category-chips">
                {selectedCategories.map((category) => (
                  <div key={category} className="category-chip">
                    <span>{category}</span>
                    <button
                      type="button"
                      className="chip-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCategories(selectedCategories.filter(cat => cat !== category));
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <input
                  type="text"
                  className="category-input"
                  placeholder={selectedCategories.length === 0 ? "Select categories" : ""}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setShowCategoryDropdown(true)}
                />
              </div>
              {showCategoryDropdown && (
                <div className="category-dropdown">
                  {categories
                    .filter(cat => 
                      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                      !selectedCategories.includes(cat.name)
                    )
                    .map((category) => (
                      <div
                        key={category.id}
                        className="category-option"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCategories([...selectedCategories, category.name]);
                          setSearchTerm('');
                        }}
                      >
                        {category.name}
                      </div>
                    ))}
                  {categories.filter(cat => 
                    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                    !selectedCategories.includes(cat.name)
                  ).length === 0 && (
                    <div className="no-results">No categories found</div>
                  )}
                </div>
              )}
            </div>
            <input
              type="hidden"
              name="categories"
              value={selectedCategories.join(',')}
              required
            />
          </div>

          <div className="blog-form-group" ref={vendorDropdownRef}>
            <label htmlFor="adSource" className="blog-form-label">Ad Source</label>
            <div className="custom-select">
              <div 
                className="select-header"
                onClick={() => setShowVendorDropdown(!showVendorDropdown)}
              >
                {selectedVendor ? 
                  vendors.find(v => v.id === selectedVendor)?.name : 
                  'Select Ad Source'
                }
              </div>
              {showVendorDropdown && (
                <div className="select-options">
                  {vendors.map((vendor) => (
                    <div
                      key={vendor.id}
                      className={`select-option ${selectedVendor === vendor.id ? 'selected' : ''}`}
                      onClick={() => handleVendorSelect(vendor)}
                    >
                      {vendor.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="blog-form-group">
            <label htmlFor="shortDescription" className="blog-form-label">Short Description</label>
            <textarea
              id="shortDescription"
              className="blog-form-input"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Enter a brief description of your blog post"
              rows="3"
              required
            />
          </div>

          <div className="blog-form-group">
            <label htmlFor="content" className="blog-form-label">Content</label>
            <div className="editor-container">
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={modules}
                formats={formats}
                placeholder="Write your blog content here..."
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="blog-cancel-btn"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="blog-submit-btn"
              disabled={loading}
            >
              {loading ? <div className="blog-loading-spinner" /> : 'Publish Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBlog; 