import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/AdminDashboard.css';
import { API_URL } from '../../../config';

const REQUEST_TIMEOUT = 10000; // 10 seconds timeout

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [editCategoryIndex, setEditCategoryIndex] = useState(null);
  const [editCategoryValue, setEditCategoryValue] = useState('');

  const fetchWithTimeout = async (url, options = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    setIsAuthenticated(true);
    
    const fetchData = async () => {
      try {
        // Fetch blogs
        const blogsResponse = await fetchWithTimeout(`${API_URL}/blogs`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!blogsResponse.ok) {
          if (blogsResponse.status === 401) {
            localStorage.removeItem('token');
            navigate('/login');
            return;
          }
          throw new Error('Failed to fetch blogs');
        }
        const blogsData = await blogsResponse.json();
        // Convert categories string to array
        const processedBlogs = blogsData.map(blog => ({
          ...blog,
          categories: blog.categories ? blog.categories.split(',') : []
        }));
        setBlogs(processedBlogs);

        // Fetch categories
        const categoriesResponse = await fetchWithTimeout(`${API_URL}/categories`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!categoriesResponse.ok) {
          if (categoriesResponse.status === 401) {
            localStorage.removeItem('token');
            navigate('/login');
            return;
          }
          throw new Error('Failed to fetch categories');
        }
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error:', error);
        setError(error.message || 'Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleDelete = async (id) => {
    if (!isAuthenticated) {
      setError('Please login to delete blogs');
      setSuccess('');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this blog?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetchWithTimeout(`${API_URL}/blogs/${id}`, {
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
        throw new Error('Failed to delete blog');
      }
      
      // Remove the deleted blog from the state
      setBlogs(blogs.filter(blog => blog.id !== id));
      setError(''); // Clear any previous errors
      setSuccess('Blog post deleted successfully!');
      
      // Clear success message after a few seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Failed to delete blog. Please try again later.');
      setSuccess('');
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      setError('Category name cannot be empty');
      setSuccess('');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetchWithTimeout(`${API_URL}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newCategory.trim() })
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        if (response.status === 409) {
          setError('Category already exists');
          setSuccess('');
          return;
        }
        throw new Error('Failed to add category');
      }

      const newCategoryData = await response.json();
      setCategories(prevCategories => [...prevCategories, newCategoryData]);
      setNewCategory('');
      setError('');
      setSuccess(`Category "${newCategoryData.name}" added successfully!`);
      
      // Clear success message after a few seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Failed to add category. Please try again later.');
      setSuccess('');
    }
  };
  
  const startEditCategory = (index) => {
    setEditCategoryIndex(index);
    setEditCategoryValue(categories[index].name);
  };
  
  const cancelEditCategory = () => {
    setEditCategoryIndex(null);
    setEditCategoryValue('');
  };
  
  const saveEditCategory = async (index) => {
    if (!editCategoryValue.trim()) {
      setError('Category name cannot be empty');
      setSuccess('');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetchWithTimeout(`${API_URL}/categories/${categories[index].id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: editCategoryValue.trim() })
      });

      if (!response.ok) {
        if (response.status === 409) {
          setError('Category name already exists');
          setSuccess('');
          return;
        }
        throw new Error('Failed to update category');
      }

      const updatedCategory = await response.json();
      const updatedCategories = [...categories];
      updatedCategories[index] = updatedCategory;
      setCategories(updatedCategories);
      setEditCategoryIndex(null);
      setEditCategoryValue('');
      setError('');
      setSuccess(`Category updated to "${updatedCategory.name}" successfully!`);
      
      // Clear success message after a few seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Failed to update category. Please try again later.');
      setSuccess('');
    }
  };
  
  const deleteCategory = async (index) => {
    const categoryId = categories[index].id;
    const categoryName = categories[index].name;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetchWithTimeout(`${API_URL}/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete category');
      
      setCategories(categories.filter((_, i) => i !== index));
      setError('');
      setSuccess(`Category "${categoryName}" deleted successfully!`);
      
      // Clear success message after a few seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || `Failed to delete category "${categoryName}". Please try again later.`);
      setSuccess('');
    }
  };

  const handleEdit = (id) => {
    navigate(`/edit-blog/${id}`);
  };

  if (loading) {
    return (
      <div className="admin-dashboard-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <div className="admin-header">
        <h1 className="admin-title">Admin Dashboard</h1>
        <div className="admin-actions">
          <button
            className="manage-categories-btn"
            onClick={() => setShowCategoryModal(true)}
          >
            Manage Categories
          </button>
          <button
            className="manage-ads-btn"
            onClick={() => navigate('/manage-ads')}
          >
            Manage Advertisements
          </button>
          <button
            className="create-blog-btn"
            onClick={() => navigate('/create-blog')}
          >
            Create New Blog
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr className="admin-table-header">
              <th>Title</th>
              <th>Author</th>
              <th>Categories</th>
              <th>Date</th>
              <th>Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {blogs.map(blog => {
              const { date, time } = formatDateTime(blog.created_at);
              return (
                <tr key={blog.id} className="admin-table-row">
                  <td className="admin-table-cell" data-label="Title">{blog.title}</td>
                  <td className="admin-table-cell" data-label="Author">{blog.author}</td>
                  <td className="admin-table-cell" data-label="Categories">
                    <div className="category-tags">
                      {blog.categories && blog.categories.length > 0 ? (
                        <div className="admin-category-view">
                          <div className="admin-category-chip">
                            <span className="category-tag">{blog.categories[0]}</span>
                            {blog.categories.length > 1 && (
                              <span className="admin-counter-badge">
                                +{blog.categories.length - 1}
                              </span>
                            )}
                          </div>
                          {blog.categories.length > 1 && (
                            <div className="category-hint-text">
                              {blog.categories.join(', ')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="category-tag no-tag">No categories</span>
                      )}
                    </div>
                  </td>
                  <td className="admin-table-cell" data-label="Date">{date}</td>
                  <td className="admin-table-cell" data-label="Time">{time}</td>
                  <td className="admin-table-cell" data-label="Actions">
                    <div className="action-buttons">
                      <button
                        className="view-btn"
                        onClick={() => navigate(`/blog/${blog.id}`)}
                      >
                        View
                      </button>
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(blog.id)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(blog.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>Manage Categories</h2>
              <button className="close-btn" onClick={() => {
                setShowCategoryModal(false);
                setError('');
                setSuccess('');
                setEditCategoryIndex(null);
              }}>×</button>
            </div>
            <div className="modal-body">
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              <div className="add-category-form">
                <input
                  type="text"
                  className="category-input"
                  placeholder="Enter new category name"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
                <button 
                  className="add-category-btn"
                  onClick={handleAddCategory}
                >
                  Add Category
                </button>
              </div>
              <div className="categories-list">
                <h3>Existing Categories</h3>
                <ul>
                  {categories.map((category, index) => (
                    <li key={category.id} className="category-item">
                      {editCategoryIndex === index ? (
                        <div className="edit-category-form">
                          <input
                            type="text"
                            className="category-edit-input"
                            value={editCategoryValue}
                            onChange={(e) => setEditCategoryValue(e.target.value)}
                            autoFocus
                          />
                          <div className="edit-actions">
                            <button 
                              className="save-btn"
                              onClick={() => saveEditCategory(index)}
                            >
                              Save
                            </button>
                            <button 
                              className="save-btn-cancel"
                              onClick={cancelEditCategory}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className="category-name">{category.name}</span>
                          <div className="category-actions">
                            <button 
                              className="edit-category-btn"
                              onClick={() => startEditCategory(index)}
                            >
                              Edit
                            </button>
                            <button 
                              className="delete-category-btn"
                              onClick={() => deleteCategory(index)}
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 