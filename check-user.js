const mysql = require('mysql2/promise');
const packageJson = require('./package.json');

async function checkUser() {
  try {
    const dbConfig = packageJson.database;
    
    // Create connection to RDS instance
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.username,
      password: dbConfig.password,
      port: dbConfig.port,
      database: 'blogger'
    });

    // Check if admin user exists
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE username = ?',
      ['admin']
    );

    if (rows.length > 0) {
      console.log('User found:', {
        id: rows[0].id,
        username: rows[0].username,
        password: rows[0].password,
        created_at: rows[0].created_at
      });
    } else {
      console.log('User not found');
    }

    await connection.end();
  } catch (error) {
    console.error('Error checking user:', error);
  }
}

checkUser(); 