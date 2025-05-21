const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const authenticateToken = require('../middleware/auth'); // JWT middleware
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret';

// REGISTER
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ status: 'error', message: 'Please provide name, email and password' });
  }

  try {
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ status: 'error', message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hashedPassword]
    );

    res.status(201).json({ status: 'success', user: result.rows[0] });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ status: 'error', message: 'Server error while registering user' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ status: 'error', message: 'Please provide email and password' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ status: 'error', message: 'User not found' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ status: 'error', message: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ status: 'success', token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ status: 'error', message: 'Login failed due to server error' });
  }
});

// GET all users (protected)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email FROM users');
    res.status(200).json({ status: 'success', users: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch users' });
  }
});

// GET user by ID (protected)
router.get('/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    res.status(200).json({ status: 'success', user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch user' });
  }
});

// UPDATE user by ID (protected)
router.put('/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;

  if (!name && !email && !password) {
    return res.status(400).json({ status: 'error', message: 'Provide at least one field to update' });
  }

  try {
    let hashedPassword;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (name) {
      fields.push(`name = $${idx++}`);
      values.push(name);
    }
    if (email) {
      fields.push(`email = $${idx++}`);
      values.push(email);
    }
    if (hashedPassword) {
      fields.push(`password = $${idx++}`);
      values.push(hashedPassword);
    }

    values.push(id);

    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, name, email`;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    res.status(200).json({ status: 'success', user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to update user' });
  }
});

// DELETE user by ID (protected)
router.delete('/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    res.status(200).json({ status: 'success', message: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to delete user' });
  }
});

module.exports = router;
