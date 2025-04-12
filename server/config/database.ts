import dotenv from 'dotenv';
import pg from 'pg';
import mysql from 'mysql2/promise';

const { Pool: PgPool } = pg;

// Load environment variables
dotenv.config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'config2page',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
};

// Validate database configuration
if (!dbConfig.password) {
  throw new Error('Database password is required. Please set DB_PASSWORD in .env file');
}

// Database type (postgres or mysql)
const dbType = process.env.DB_TYPE || 'postgres';

// Create database connection based on type
let db: InstanceType<typeof PgPool> | mysql.Pool;

if (dbType === 'postgres') {
  db = new PgPool({
    host: dbConfig.host,
    port: dbConfig.port || 5432,
    database: dbConfig.database,
    user: dbConfig.user,
    password: dbConfig.password,
  });
  console.log('PostgreSQL database connection established');
} else if (dbType === 'mysql') {
  db = mysql.createPool({
    host: dbConfig.host,
    port: dbConfig.port || 3306,
    database: dbConfig.database,
    user: dbConfig.user,
    password: dbConfig.password,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
  console.log('MySQL database connection established');
} else {
  throw new Error('Invalid database type specified. Use "postgres" or "mysql"');
}

// Test database connection
async function testConnection() {
  try {
    if (dbType === 'postgres') {
      await (db as InstanceType<typeof PgPool>).query('SELECT NOW()');
    } else {
      await (db as mysql.Pool).query('SELECT NOW()');
    }
    console.log('Database connection test successful');
  } catch (error) {
    console.error('Database connection test failed:', error);
  }
}

// Execute query based on database type
async function executeQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
  try {
    if (dbType === 'postgres') {
      const result = await (db as InstanceType<typeof PgPool>).query(query, params);
      return result.rows as T[];
    } else {
      const [rows] = await (db as mysql.Pool).query(query, params);
      return rows as T[];
    }
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  }
}

export { db, dbType, testConnection, executeQuery };
