const mysql = require('mysql2/promise');
const packageJson = require('./package.json');

async function checkAdminUser() {
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
      console.log('Admin user found:', rows[0]);
    } else {
      console.log('Admin user not found');
    }

    await connection.end();
  } catch (error) {
    console.error('Error checking admin user:', error);
  }
}

checkAdminUser(); 