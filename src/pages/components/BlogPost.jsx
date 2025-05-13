import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import '../css/BlogPost.css';
import { API_URL } from '../../../config';

const PopupAd = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="popup-ad-overlay">
      <div className="popup-ad-container">
        <button className="popup-close-btn" onClick={onClose}>&times;</button>
        <div className="popup-ad-content">
          <div className="popup-ad-placeholder">
            <div className="popup-ad-debug">
              Popup Ad Space
              <br />
              500x400 Pixels
              <br />
              <small>(Visibility Status: {isVisible ? 'Visible' : 'Hidden'})</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BlogPost = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPopupAd, setShowPopupAd] = useState(false);
  const [adVisibility, setAdVisibility] = useState({
    header: true,
    left: true,
    right: true,
    footerLeft: true,
    footerRight: true,
    footer: true,
    popup: true
  });

  useEffect(() => {
    // Load ad visibility settings from localStorage
    const savedSettings = localStorage.getItem('adVisibilitySettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (Array.isArray(settings)) {
          // Find the popup setting specifically
          const popupSetting = settings.find(setting => setting.id === 'popup');
          console.log('Found popup setting:', popupSetting);
          
          // Create visibility map from all settings
          const visibilityMap = settings.reduce((acc, setting) => {
            acc[setting.id] = setting.isVisible;
            return acc;
          }, {});
          
          console.log('Loaded ad visibility settings:', visibilityMap);
          setAdVisibility(prevState => ({
            ...prevState,
            ...visibilityMap
          }));
        }
      } catch (error) {
        console.error('Error parsing ad settings:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Show popup ad after 3 seconds if it's enabled
    if (adVisibility.popup) {
      console.log('Setting up popup timer... Popup visibility:', adVisibility.popup); // Debug log
      const timer = setTimeout(() => {
        console.log('Showing popup ad...'); // Debug log
        setShowPopupAd(true);
      }, 3000);
      return () => {
        console.log('Cleaning up popup timer...'); // Debug log
        clearTimeout(timer);
      };
    } else {
      console.log('Popup ad is disabled. Visibility setting:', adVisibility.popup); // Debug log
    }
  }, [adVisibility.popup]);

  // Add this debug function to print settings
  useEffect(() => {
    // This will run once after settings are loaded
    console.log('Current ad visibility settings:', adVisibility);
    // Check localStorage directly
    const savedSettings = localStorage.getItem('adVisibilitySettings');
    if (savedSettings) {
      console.log('Raw localStorage settings:', savedSettings);
    }
  }, [adVisibility]);

  const fetchBlog = async () => {
    try {
      const response = await fetch(`${API_URL}/blogs/${id}`);
      if (!response.ok) {
        throw new Error('Blog not found');
      }
      const data = await response.json();
      setBlog(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlog();
  }, [id]);

  useEffect(() => {
    // Load Google AdSense script
    const script = document.createElement('script');
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);

    // Initialize ads after script loads
    script.onload = () => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        console.error('AdSense error:', error);
      }
    };

    return () => {
      // Cleanup script on unmount
      document.head.removeChild(script);
    };
  }, []);

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (loading) {
    return (
      <div className="blog-post-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="blog-post-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="blog-post-container">
        <div className="error-message">Blog post not found</div>
      </div>
    );
  }

  const { date, time } = formatDateTime(blog.created_at);

  return (
    <div className="blog-post-container">
      <PopupAd 
        isVisible={showPopupAd && (adVisibility.popup !== false)} 
        onClose={() => {
          console.log('Closing popup ad...'); // Debug log
          setShowPopupAd(false);
        }} 
      />
      
      {adVisibility.header && (
        <div className="header-ad-container">
          {/* Header ad */}
        </div>
      )}
      
      <div className={`blog-content-wrapper ${!adVisibility.left ? 'left-ad-hidden' : ''} ${!adVisibility.right ? 'right-ad-hidden' : ''}`}>
        {adVisibility.left && (
          <div className="left-ad-container">
            {/* Left side ad */}
          </div>
        )}

        <article className="blog-post-article">
          <header className="blog-post-header">
            <h1 className="blog-post-title">{blog.title}</h1>
            <div className="blog-post-meta">
              <div className="blog-post-author">
                <span className="by-text">By</span>
                <span className="author-name">{blog.author}</span>
              </div>
              <time className="blog-post-date">{date} at {time}</time>
            </div>
          </header>
          
          <div 
            className="blog-post-content"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </article>

        {adVisibility.right && (
          <div className="right-ad-container">
            {/* Right side ad */}
          </div>
        )}
      </div>

      <div className="bottom-ads-container">
        <div className="square-ads-wrapper">
          {adVisibility.footerLeft && (
            <div className="square-ad">
              {/* Bottom left square ad */}
            </div>
          )}
          {adVisibility.footerRight && (
            <div className="square-ad">
              {/* Bottom right square ad */}
            </div>
          )}
        </div>
        {adVisibility.footer && (
          <div className="footer-ad-container">
            {/* Footer ad */}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPost; 