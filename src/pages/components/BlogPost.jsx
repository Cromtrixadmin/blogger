import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import '../css/BlogPost.css';
import { BACKEND_URL } from '../../config';


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
              400x400 Pixels
              <br />
              <small>(Visibility Status: {isVisible ? 'Visible' : 'Hidden'})</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdComponent = ({ adCode }) => {
  const adContainerRef = useRef(null);

  useEffect(() => {
    if (adContainerRef.current && adCode) {
      // Clear previous ad content
      adContainerRef.current.innerHTML = '';

      // Create a temporary container to parse the ad code
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = adCode;

      // Append all child nodes from temp container to the ad container
      while (tempContainer.firstChild) {
        adContainerRef.current.appendChild(tempContainer.firstChild);
      }

      // Find and re-execute scripts
      const scripts = Array.from(adContainerRef.current.getElementsByTagName('script'));
      scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        
        // Copy attributes
        for (let i = 0; i < oldScript.attributes.length; i++) {
          newScript.setAttribute(oldScript.attributes[i].name, oldScript.attributes[i].value);
        }
        
        // Copy content or src
        if (oldScript.src) {
          newScript.src = oldScript.src;
        } else {
          try {
            newScript.appendChild(document.createTextNode(oldScript.innerHTML));
          } catch (e) {
            console.error('Error creating script text node:', e);
          }
        }
        
        // Replace the old script tag with the new one to trigger execution
        if (oldScript.parentNode) {
          oldScript.parentNode.replaceChild(newScript, oldScript);
        }
      });
    }
  }, [adCode]);

  return <div ref={adContainerRef} className="in-content-ad-wrapper" />;
};

const BlogPost = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPopupAd, setShowPopupAd] = useState(false);
  const [inContentAd, setInContentAd] = useState(null);
  const [adVisibility, setAdVisibility] = useState({
    header: true,
    left: true,
    right: true,
    'in-content': true,
    footerLeft: true,
    footerRight: true,
    footer: true,
    popup: true
  });

  // Fetch ad visibility settings from the API
  const fetchAdVisibilitySettings = async () => {
    try {
      const token = localStorage.getItem('token'); // Assuming token might be needed, or remove if not
      const response = await fetch(`${BACKEND_URL}/ad-visibility`, {
        headers: {
          // Add Authorization header if your API requires it for this endpoint
          // 'Authorization': `Bearer ${token}` 
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch ad visibility settings');
      }
      const settings = await response.json();
      if (settings && Array.isArray(settings)) {
        const visibilityMap = settings.reduce((acc, setting) => {
          acc[setting.id] = setting.isVisible;
          return acc;
        }, {});
        console.log('Loaded ad visibility settings from API:', visibilityMap);
        setAdVisibility(prevState => ({
          ...prevState,
          ...visibilityMap
        }));
      } else {
        // Fallback to default if API returns unexpected data or empty array
        console.log('API returned unexpected data for ad settings, using defaults.');
      }
    } catch (error) {
      console.error('Error fetching ad visibility settings:', error);
      // Fallback to default state in case of error, adVisibility already holds defaults
      console.log('Using default ad visibility settings due to fetch error.');
    }
  };

  useEffect(() => {
    fetchAdVisibilitySettings();
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
      const response = await fetch(`${BACKEND_URL}/blogs/${id}`);
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

  useEffect(() => {
    const fetchInContentAd = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/ads/location/In-Content Ad`);
        if (response.ok) {
          const adData = await response.json();
          if (adData && adData.ad_code) {
            setInContentAd(adData.ad_code);
          }
        }
      } catch (error) {
        console.error('Error fetching in-content ad:', error);
      }
    };

    if (adVisibility['in-content']) {
      fetchInContentAd();
    }
  }, [adVisibility]);

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

  const renderContentWithAd = () => {
    if (!blog?.content) return null;

    if (!inContentAd || !adVisibility['in-content']) {
      return <div className="blog-post-content" dangerouslySetInnerHTML={{ __html: blog.content }} />;
    }
    
    // Split content by paragraphs. It's a simple but effective way for typical blog posts.
    const contentParts = blog.content.split('</p>');
    const adInjectionIndex = 2; // Inject after the 2nd paragraph

    if (contentParts.length <= adInjectionIndex) {
      // If content is too short, append ad at the end.
      return (
        <div className="blog-post-content">
          <div dangerouslySetInnerHTML={{ __html: blog.content }} />
          <AdComponent adCode={inContentAd} />
        </div>
      );
    }

    const contentWithAd = contentParts.reduce((acc, part, index) => {
      // Re-add the closing paragraph tag that was removed by split()
      const partWithTag = (index < contentParts.length - 1 || blog.content.endsWith('</p>')) 
        ? `${part}</p>` 
        : part;

      acc.push(<div key={`content-${index}`} dangerouslySetInnerHTML={{ __html: partWithTag }} />);
      
      if (index === adInjectionIndex - 1) {
        acc.push(<AdComponent key="in-content-ad" adCode={inContentAd} />);
      }
      
      return acc;
    }, []);

    return <div className="blog-post-content">{contentWithAd}</div>;
  };

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
          
          {renderContentWithAd()}
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