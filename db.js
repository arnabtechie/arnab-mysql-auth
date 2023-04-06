const mysql = require('mysql2/promise');
const config = require('./config.json')

const pool = mysql.createPool({
  host: config.DB.HOST,
  user: config.DB.USERNAME,
  password: config.DB.PASSWORD,
  database: config.DB.DATABASE_NAME,
  connectionLimit: 10
});


pool.getConnection()
  .then(connection => {
    console.log('database connected');
    connection.release();
  })
  .catch(error => console.log('Error acquiring connection:', error));


module.exports = pool;