import pool from './db.js';
import bcrypt from 'bcryptjs';

// Register a new user (employee or manager)
export const registerUser = async (username, password, role) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const query = 'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role';
  const values = [username, hashedPassword, role];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Find a user by username
export const findUserByUsername = async (username) => {
  const query = 'SELECT * FROM users WHERE username = $1';
  const result = await pool.query(query, [username]);
  return result.rows[0];
};
