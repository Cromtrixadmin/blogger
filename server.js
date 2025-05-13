const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: '.env.current' });
const { authenticateToken } = require('./middleware/authMiddleware');

const app = express();
const port = process.env.API_PORT || 5001;

// Load environment files
const currentEnv = process.env.CURRENT_ENV || 'dev';
require('dotenv').config({ path: `.env.${currentEnv}` });

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (currentEnv === 'dev') {
      // In development, allow localhost
      callback(null, true);
    } else {
      // In production, allow both IP and domain
      const allowedOrigins = [
        `http://${process.env.EC2_IP}:${process.env.FRONTEND_PORT}`,
        `http://${process.env.DOMAIN_NAME}`,
        `https://${process.env.DOMAIN_NAME}`
      ];
      
      // Check if origin matches any allowed origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Create a connection pool instead of a single connection
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'blogger',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  multipleStatements: true,
  connectTimeout: 50000,
  acquireTimeout: 50000,
  timeout: 50000
});

// Add debug logging
console.log('Database Configuration:', {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'blogger'
});

// Log current environment and configuration
console.log(`Running in ${currentEnv.toUpperCase()} environment`);
console.log(`Database host: ${process.env.DB_HOST}`);
console.log(`API Port: ${port}`);

// Log connection errors
pool.on('error', (err) => {
  console.error('Database pool error:', err);
  console.error('Error code:', err.code);
  console.error('Error message:', err.message);
  
  // Attempt to reconnect if connection is lost
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Database connection lost. Attempting to reconnect...');
    // Connection will be automatically re-established on next query
  }
});

// Test the connection and database structure
const testDatabaseConnection = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('Database connection established successfully');

    // Test if required tables exist
    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = tables.map(table => Object.values(table)[0]);
    console.log('Available tables:', tableNames);

    // Check if required tables exist
    const requiredTables = ['blogs', 'categories', 'blog_categories', 'users', 'vendors', 'ads'];
    const missingTables = requiredTables.filter(table => !tableNames.includes(table));
    
    if (missingTables.length > 0) {
      console.log('Missing required tables:', missingTables);
      
      // Create ads table if it doesn't exist
      if (missingTables.includes('ads')) {
        console.log('Creating ads table...');
        try {
          await connection.execute(`
            CREATE TABLE ads (
              id INT AUTO_INCREMENT PRIMARY KEY,
              vendor_id INT NOT NULL,
              location_id VARCHAR(50) NOT NULL,
              ad_code TEXT NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
              UNIQUE KEY vendor_location (vendor_id, location_id)
            )
          `);
          console.log('Ads table created successfully');
        } catch (error) {
          console.error('Error creating ads table:', error);
          throw error;
        }
      } else {
        throw new Error(`Missing required tables: ${missingTables.join(', ')}`);
      }
    }
  } catch (error) {
    console.error('Database connection test failed:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

// Test connection and start server
testDatabaseConnection()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch(error => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });

// Simple ping endpoint for testing
app.get('/ping', (req, res) => {
  console.log('Ping endpoint called');
  res.json({ message: 'Server is running' });
});

// API Routes
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt for user:', username);
    
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, password]
    );

    if (rows.length === 0) {
      console.log('Invalid credentials for user:', username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = 'dummy-token'; // This should be a JWT token in production
    console.log('Successful login for user:', username);
    res.json({ 
      token,
      user: {
        id: rows[0].id,
        username: rows[0].username,
        role: rows[0].role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error', details: error.message });
  }
});

app.get('/api/blogs', async (req, res) => {
  try {
    const [blogs] = await pool.execute(
      `
      SELECT b.*, GROUP_CONCAT(c.name) as categories
      FROM blogs b
      LEFT JOIN blog_categories bc ON b.id = bc.blog_id
      LEFT JOIN categories c ON bc.category_id = c.id
      GROUP BY b.id
      `
    );

    // Ensure categories is always a string
    const processedBlogs = blogs.map(blog => ({
      ...blog,
      categories: blog.categories || ''
    }));

    res.json(processedBlogs);
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single blog post by ID
app.get('/api/blogs/:id', async (req, res) => {
  try {
    const blogId = req.params.id;
    const [rows] = await pool.execute(
      `
      SELECT b.*, GROUP_CONCAT(c.name) as categories
      FROM blogs b
      LEFT JOIN blog_categories bc ON b.id = bc.blog_id
      LEFT JOIN categories c ON bc.category_id = c.id
      WHERE b.id = ?
      GROUP BY b.id
      `,
      [blogId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    const blog = { ...rows[0], categories: rows[0].categories || '' };
    res.json(blog);
  } catch (error) {
    console.error('Error fetching blog post by ID:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/blogs', async (req, res) => {
  console.log('Starting blog creation process');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  const connection = await pool.getConnection();
  
  try {
    // Extract data from request body
    const { title, author, content, categories, shortDescription, vendor_id } = req.body;
    
    // Log extracted data
    console.log('Extracted data:');
    console.log('title:', title, typeof title);
    console.log('author:', author, typeof author);
    console.log('content length:', content?.length || 0);
    console.log('categories:', JSON.stringify(categories));
    console.log('shortDescription:', shortDescription, typeof shortDescription);
    console.log('vendor_id:', vendor_id, typeof vendor_id);
    
    // Validate required fields
    if (!title || !author || !content || !categories || !shortDescription) {
      const missingFields = [];
      if (!title) missingFields.push('title');
      if (!author) missingFields.push('author');
      if (!content) missingFields.push('content');
      if (!categories || !Array.isArray(categories) || categories.length === 0) missingFields.push('categories');
      if (!shortDescription) missingFields.push('shortDescription');
      
      console.log('Missing or invalid fields:', missingFields);
      return res.status(400).json({
        error: 'Missing required fields',
        details: `The following fields are required: ${missingFields.join(', ')}`
      });
    }
    
    // Validate vendor_id
    const vendorIdNum = parseInt(vendor_id, 10);
    if (isNaN(vendorIdNum) || vendorIdNum <= 0) {
      console.log('Invalid vendor_id:', vendor_id);
      return res.status(400).json({
        error: 'Invalid vendor_id',
        details: 'vendor_id must be a positive number'
      });
    }
    
    // Start transaction
    await connection.beginTransaction();
    
    try {
      // Simple insert blog query
      const insertQuery = 'INSERT INTO blogs (title, author, content, short_description, vendor_id) VALUES (?, ?, ?, ?, ?)';
      const insertParams = [title, author, content, shortDescription, vendorIdNum];
      
      console.log('Executing insert query');
      const [result] = await connection.execute(insertQuery, insertParams);
      
      const blogId = result.insertId;
      console.log('Blog inserted with ID:', blogId);
      
      // Process categories
      for (const categoryName of categories) {
        // Insert category if doesn't exist
        await connection.execute('INSERT IGNORE INTO categories (name) VALUES (?)', [categoryName]);
        
        // Get category ID
        const [categoryResult] = await connection.execute('SELECT id FROM categories WHERE name = ?', [categoryName]);
        
        if (categoryResult.length > 0) {
          const categoryId = categoryResult[0].id;
          
          // Create relationship
          await connection.execute(
            'INSERT INTO blog_categories (blog_id, category_id) VALUES (?, ?)',
            [blogId, categoryId]
          );
        }
      }
      
      // Commit transaction
      await connection.commit();
      
      // Return success response
      return res.status(201).json({
        success: true,
        message: 'Blog created successfully',
        blogId: blogId
      });
    } catch (err) {
      // Rollback on error
      await connection.rollback();
      throw err;
    }
  } catch (error) {
    console.error('Error creating blog:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to create blog',
      message: error.message
    });
  } finally {
    // Release connection
    connection.release();
  }
});

// Delete a blog
app.delete('/api/blogs/:id', authenticateToken, async (req, res) => {
  console.log('Starting blog deletion process for ID:', req.params.id);
  const connection = await pool.getConnection();
  try {
    const blogId = req.params.id;
    
    // Start a transaction
    console.log('Starting transaction');
    await connection.beginTransaction();

    try {
      // Delete blog categories first
      console.log('Deleting blog categories');
      await connection.execute('DELETE FROM blog_categories WHERE blog_id = ?', [blogId]);
      
      // Delete the blog
      console.log('Deleting blog');
      const [result] = await connection.execute('DELETE FROM blogs WHERE id = ?', [blogId]);
      
      if (result.affectedRows === 0) {
        console.log('No blog found with ID:', blogId);
        await connection.rollback();
        return res.status(404).json({ error: 'Blog not found' });
      }

      console.log('Committing transaction');
      await connection.commit();
      res.status(200).json({ message: 'Blog deleted successfully' });
    } catch (error) {
      console.error('Error during transaction:', error);
      console.error('Error stack:', error.stack);
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error deleting blog:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to delete blog', 
      details: error.message,
      code: error.code
    });
  } finally {
    connection.release();
  }
});

// Update a blog
app.put('/api/blogs/:id', authenticateToken, async (req, res) => {
  console.log('Starting blog update process for ID:', req.params.id);
  const connection = await pool.getConnection();
  try {
    const blogId = req.params.id;
    const { title, author, content, categories, shortDescription, vendor_id } = req.body;
    console.log('Received update data:', { title, author, categories, shortDescription, vendor_id });
    
    // Start a transaction
    console.log('Starting transaction');
    await connection.beginTransaction();

    try {
      // Update blog
      console.log('Updating blog in database');
      const [result] = await connection.execute(
        'UPDATE blogs SET title = ?, author = ?, content = ?, short_description = ?, vendor_id = ? WHERE id = ?',
        [title, author, content, shortDescription, vendor_id, blogId]
      );

      if (result.affectedRows === 0) {
        console.log('No blog found with ID:', blogId);
        await connection.rollback();
        return res.status(404).json({ error: 'Blog not found' });
      }

      // Delete existing categories
      console.log('Deleting existing blog categories');
      await connection.execute('DELETE FROM blog_categories WHERE blog_id = ?', [blogId]);

      // Insert new categories
      for (const categoryName of categories) {
        console.log('Processing category:', categoryName);
        
        // Insert category if it doesn't exist
        console.log('Inserting category if not exists');
        await connection.execute(
          'INSERT IGNORE INTO categories (name) VALUES (?)',
          [categoryName]
        );

        // Get category ID
        console.log('Getting category ID');
        const [category] = await connection.execute(
          'SELECT id FROM categories WHERE name = ?',
          [categoryName]
        );

        // Create relationship
        console.log('Creating blog-category relationship');
        await connection.execute(
          'INSERT INTO blog_categories (blog_id, category_id) VALUES (?, ?)',
          [blogId, category[0].id]
        );
      }

      console.log('Committing transaction');
      await connection.commit();
      res.status(200).json({ message: 'Blog updated successfully' });
    } catch (error) {
      console.error('Error during transaction:', error);
      console.error('Error stack:', error.stack);
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error updating blog:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to update blog', 
      details: error.message,
      code: error.code
    });
  } finally {
    connection.release();
  }
});

// Categories API Routes
app.get('/api/categories', async (req, res) => {
  try {
    const [categories] = await pool.execute('SELECT * FROM categories ORDER BY name');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name } = req.body;
    
    // Check if category already exists
    const [existing] = await pool.execute(
      'SELECT * FROM categories WHERE name = ?',
      [name]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: 'Category already exists' });
    }

    // Insert new category
    const [result] = await pool.execute(
      'INSERT INTO categories (name) VALUES (?)',
      [name]
    );

    const [newCategory] = await pool.execute(
      'SELECT * FROM categories WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newCategory[0]);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Check if category exists
    const [existing] = await pool.execute(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if new name already exists
    const [duplicate] = await pool.execute(
      'SELECT * FROM categories WHERE name = ? AND id != ?',
      [name, id]
    );

    if (duplicate.length > 0) {
      return res.status(409).json({ message: 'Category name already exists' });
    }

    // Update category
    await pool.execute(
      'UPDATE categories SET name = ? WHERE id = ?',
      [name, id]
    );

    const [updatedCategory] = await pool.execute(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    res.json(updatedCategory[0]);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const [existing] = await pool.execute(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Delete category (cascade will handle blog_categories)
    await pool.execute(
      'DELETE FROM categories WHERE id = ?',
      [id]
    );

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Vendors API Routes
app.get('/api/vendors', authenticateToken, async (req, res) => {
  try {
    const [vendors] = await pool.execute('SELECT * FROM vendors ORDER BY name');
    res.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/vendors', authenticateToken, async (req, res) => {
  console.log('Starting vendor creation process');
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  
  const connection = await pool.getConnection();
  try {
    const { name, email, phone, status } = req.body;
    console.log('Received vendor data:', { name, email, phone, status });

    // Validate required fields
    if (!name || !name.trim()) {
      console.log('Validation failed: name is required');
      return res.status(400).json({ 
        error: 'Validation failed',
        details: 'Vendor name is required'
      });
    }

    // Check if vendor with same email already exists (if email is provided)
    if (email) {
      console.log('Checking for existing vendor with email:', email);
      const [existing] = await connection.execute(
        'SELECT * FROM vendors WHERE email = ?',
        [email]
      );

      if (existing.length > 0) {
        console.log('Vendor with email already exists:', email);
        return res.status(409).json({ 
          error: 'Duplicate vendor',
          details: 'A vendor with this email already exists'
        });
      }
    }

    // Insert new vendor
    console.log('Inserting vendor into database with values:', { 
      name, 
      email: email || null, 
      phone: phone || null, 
      status: status || 'active' 
    });

    const [result] = await connection.execute(
      'INSERT INTO vendors (name, email, phone, status) VALUES (?, ?, ?, ?)',
      [name, email || null, phone || null, status || 'active']
    );

    console.log('Insert result:', result);

    // Get the newly created vendor
    const [newVendor] = await connection.execute(
      'SELECT * FROM vendors WHERE id = ?',
      [result.insertId]
    );

    console.log('Vendor created successfully:', newVendor[0]);
    res.status(201).json(newVendor[0]);
  } catch (error) {
    console.error('Error creating vendor:', error);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Check for specific database errors
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({ 
        error: 'Database error',
        details: 'Vendors table does not exist',
        code: error.code
      });
    }
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        error: 'Duplicate entry',
        details: 'A vendor with this information already exists',
        code: error.code
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create vendor', 
      details: error.message,
      code: error.code
    });
  } finally {
    connection.release();
  }
});

// Get single vendor
app.get('/api/vendors/:id', authenticateToken, async (req, res) => {
  try {
    const [vendors] = await pool.execute('SELECT * FROM vendors WHERE id = ?', [req.params.id]);
    if (vendors.length === 0) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.json(vendors[0]);
  } catch (error) {
    console.error('Error fetching vendor:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update vendor
app.put('/api/vendors/:id', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { name, email, phone, status } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: 'Vendor name is required'
      });
    }

    // Check if vendor exists
    const [existing] = await connection.execute(
      'SELECT * FROM vendors WHERE id = ?',
      [req.params.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== existing[0].email) {
      const [emailCheck] = await connection.execute(
        'SELECT * FROM vendors WHERE email = ? AND id != ?',
        [email, req.params.id]
      );

      if (emailCheck.length > 0) {
        return res.status(409).json({ 
          error: 'Duplicate vendor',
          details: 'A vendor with this email already exists'
        });
      }
    }

    // Update vendor
    await connection.execute(
      'UPDATE vendors SET name = ?, email = ?, phone = ?, status = ? WHERE id = ?',
      [name, email || null, phone || null, status || 'active', req.params.id]
    );

    // Get the updated vendor
    const [updatedVendor] = await connection.execute(
      'SELECT * FROM vendors WHERE id = ?',
      [req.params.id]
    );

    res.json(updatedVendor[0]);
  } catch (error) {
    console.error('Error updating vendor:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
});

// Delete vendor
app.delete('/api/vendors/:id', authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM vendors WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Ads API Routes
app.get('/api/ads', authenticateToken, async (req, res) => {
  try {
    const [ads] = await pool.execute('SELECT * FROM ads ORDER BY created_at DESC');
    res.json(ads);
  } catch (error) {
    console.error('Error fetching ads:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get ads for a specific vendor
app.get('/api/ads/vendor/:vendorId', authenticateToken, async (req, res) => {
  try {
    const [ads] = await pool.execute(
      'SELECT ads.*, vendors.name as vendor_name FROM ads JOIN vendors ON ads.vendor_id = vendors.id WHERE vendor_id = ? ORDER BY created_at DESC', 
      [req.params.vendorId]
    );
    res.json(ads);
  } catch (error) {
    console.error('Error fetching vendor ads:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Save ads for a vendor
app.post('/api/ads', authenticateToken, async (req, res) => {
  console.log('POST /api/ads - Received request');
  console.log('Request body:', req.body);
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { vendorId, adEntries } = req.body;
    console.log('Extracted data - vendorId:', vendorId, 'adEntries count:', adEntries?.length || 0);
    
    // Validate required fields
    if (!vendorId) {
      console.log('Validation failed: vendorId is required');
      return res.status(400).json({ 
        error: 'Validation failed',
        details: 'Vendor ID is required'
      });
    }
    
    // Allow empty adEntries array (which means clear all ads for this vendor)
    if (!adEntries) {
      console.log('Validation failed: adEntries are required');
      return res.status(400).json({ 
        error: 'Validation failed',
        details: 'Ad entries are required'
      });
    }
    
    if (!Array.isArray(adEntries)) {
      console.log('Validation failed: adEntries must be an array');
      return res.status(400).json({ 
        error: 'Validation failed',
        details: 'Ad entries must be an array'
      });
    }
    
    // Delete existing ads for this vendor first
    console.log('Deleting existing ads for vendor:', vendorId);
    await connection.execute('DELETE FROM ads WHERE vendor_id = ?', [vendorId]);
    
    // If there are entries to insert, do so
    if (adEntries.length > 0) {
      // Insert all new ad entries
      console.log('Inserting new ad entries...');
      for (const entry of adEntries) {
        const { locationId, adCode } = entry;
        console.log('Processing entry - locationId:', locationId, 'adCode length:', adCode?.length || 0);
        
        if (!locationId || !adCode) {
          console.log('Validation failed: locationId or adCode is missing');
          await connection.rollback();
          return res.status(400).json({ 
            error: 'Validation failed',
            details: 'Location ID and ad code are required for each entry'
          });
        }
        
        // Store the exact location value without any modification
        await connection.execute(
          'INSERT INTO ads (vendor_id, location_id, ad_code) VALUES (?, ?, ?)',
          [vendorId, locationId, adCode]
        );
      }
      console.log('All entries inserted successfully, committing transaction');
    } else {
      console.log('No entries to insert, all ads cleared for vendor:', vendorId);
    }
    
    await connection.commit();
    res.status(201).json({ message: 'Ads saved successfully' });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error saving ads:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        error: 'Duplicate entry',
        details: 'A duplicate ad location entry exists for this vendor',
        code: error.code
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to save ads', 
      details: error.message,
      code: error.code
    });
  } finally {
    connection.release();
  }
});

// Delete a specific ad
app.delete('/api/ads/:id', authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM ads WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ad not found' });
    }
    res.json({ message: 'Ad deleted successfully' });
  } catch (error) {
    console.error('Error deleting ad:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  console.error('Error stack:', err.stack);
  
  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({ 
      error: 'Database connection failed', 
      details: 'Unable to connect to the database',
      code: err.code
    });
  }
  if (err.code === 'ER_ACCESS_DENIED_ERROR') {
    return res.status(500).json({ 
      error: 'Database access denied', 
      details: 'Invalid database credentials',
      code: err.code
    });
  }
  if (err.code === 'ER_NO_SUCH_TABLE') {
    return res.status(500).json({ 
      error: 'Database table not found', 
      details: 'Required database tables are missing',
      code: err.code
    });
  }
  
  res.status(500).json({ 
    error: 'Internal server error', 
    details: err.message,
    code: err.code
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', details: 'The requested resource was not found' });
}); 