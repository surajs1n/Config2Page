import { executeQuery, dbType } from './database.js';
import { createUserTableQuery } from '../models/User.js';

export async function initializeDatabase() {
  try {
    // Create users table based on database type
    if (dbType === 'postgres') {
      await executeQuery(createUserTableQuery.postgres);
    } else {
      await executeQuery(createUserTableQuery.mysql);
    }
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database tables:', error);
    throw error;
  }
}
