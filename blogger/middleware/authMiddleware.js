const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token is required' });
  }

  // In a real application, you would verify the JWT token here
  // For this example, we'll just check if it's the dummy token
  if (token !== 'dummy-token') {
    return res.status(403).json({ error: 'Invalid token' });
  }

  next();
};

module.exports = { authenticateToken }; 