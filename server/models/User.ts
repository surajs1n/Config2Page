export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: 'admin' | 'moderator' | 'user';
  password: string;
  created_at: Date;
  updated_at: Date;
}

export const createUserTableQuery = {
  postgres: `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      email VARCHAR(255) UNIQUE NOT NULL,
      role VARCHAR(20) CHECK (role IN ('admin', 'moderator', 'user')),
      password TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,
  mysql: `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      email VARCHAR(255) UNIQUE NOT NULL,
      role ENUM('admin', 'moderator', 'user'),
      password TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `
};

// Password validation
export const validatePassword = (password: string): boolean => {
  const minLength = 8;
  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  
  return password.length >= minLength && hasLowerCase && hasUpperCase;
};

// User validation
export const validateUser = (user: Partial<User>): { isValid: boolean; error?: string } => {
  if (!user.email?.includes('@')) {
    return { isValid: false, error: 'Invalid email format' };
  }

  if (user.password && !validatePassword(user.password)) {
    return {
      isValid: false,
      error: 'Password must be at least 8 characters long and contain both uppercase and lowercase letters'
    };
  }

  if (user.role && !['admin', 'moderator', 'user'].includes(user.role)) {
    return { isValid: false, error: 'Invalid role' };
  }

  return { isValid: true };
};
