import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../../config';
import '../css/Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBlogs, setFilteredBlogs] = useState([]);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await fetch(`${API_URL}/blogs`);
        if (!response.ok) throw new Error('Failed to fetch blogs');
        const data = await response.json();
        
        // Process the blogs data
        const processedBlogs = data.map(blog => ({
          ...blog,
          categories: blog.categories ? blog.categories.split(',') : []
        }));
        
        setBlogs(processedBlogs);
        setFilteredBlogs(processedBlogs);
        
        // No longer need to extract categories for filtering
      } catch (error) {
        console.error('Error:', error);
        setError('Failed to load blogs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  useEffect(() => {
    // Only apply search filter now
    let results = blogs;
    
    // Apply search filter
    if (searchTerm.trim() !== '') {
      const lowercaseSearch = searchTerm.toLowerCase();
      results = results.filter(blog => 
        blog.title.toLowerCase().includes(lowercaseSearch) || 
        blog.content.toLowerCase().includes(lowercaseSearch) ||
        blog.author.toLowerCase().includes(lowercaseSearch)
      );
    }
    
    setFilteredBlogs(results);
  }, [searchTerm, blogs]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  if (loading) {
    return (
      <div className="home-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <header className="home-header">
        <h1 className="home-title">Welcome to Dev Blog</h1>
        <p className="home-subtitle">Discover the latest insights in web development and technology</p>
        
        <div className="search-container">
          <div className="search-bar">
            <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search for blogs, topics, or authors..."
              value={searchTerm}
              onChange={handleSearch}
            />
            {searchTerm && (
              <button 
                className="clear-search" 
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="blog-grid">
        {filteredBlogs.length > 0 ? (
          filteredBlogs.map(blog => (
            <article key={blog.id} className="blog-card" onClick={() => navigate(`/blog/${blog.id}`)}>
              <div className="blog-card-content">
                <div className="blog-card-header">
                  <div className="category-wrapper">
                    {blog.categories && blog.categories.length > 0 ? (
                      <div className="home-category-view">
                        <div className="home-category-chip">
                          <span className="home-category-tag">{blog.categories[0]}</span>
                          {blog.categories.length > 1 && (
                            <span className="home-counter-badge">
                              +{blog.categories.length - 1}
                            </span>
                          )}
                        </div>
                        {blog.categories.length > 1 && (
                          <div className="home-category-hint-text">
                            {blog.categories.join(', ')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="home-category-tag no-tag">No categories</span>
                    )}
                  </div>
                  <span className="blog-read-time">{blog.readTime}</span>
                </div>
                <h2 className="blog-card-title">{blog.title}</h2>
                <p className="blog-card-excerpt">{blog.short_description}</p>
                <div className="blog-card-meta">
                  <div className="blog-author">
                    <div className="author-avatar">
                      {blog.author.charAt(0)}
                    </div>
                    <span className="author-name">{blog.author}</span>
                  </div>
                  <span className="blog-date">{formatDate(blog.created_at)}</span>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="no-results-message">
            <p>No blogs found matching "{searchTerm}"</p>
            <button className="reset-search" onClick={() => setSearchTerm('')}>
              Clear search
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home; 