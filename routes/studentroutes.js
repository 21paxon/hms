// routes/studentroutes.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // Make sure this connects to your PostgreSQL database

// ✅ CREATE a student
router.post('/', async (req, res) => {
  const { name, email, course, department, year, reg_number } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO students (name, email, course, department, year, reg_number)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, email, course, department, year, reg_number]
    );
    res.status(201).json({ message: 'Student added successfully', student: result.rows[0] });
  } catch (error) {
    console.error('Student insert error:', error);
    res.status(500).json({ error: 'Failed to insert student' });
  }
});

// ✅ READ all students
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students ORDER BY id DESC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// ✅ READ one student by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM students WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Get student by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// PATCH student by ID (safe partial update)
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const fields = ['name', 'email', 'course', 'department', 'year', 'reg_number'];
  const updates = [];
  const values = [];

  // Build dynamic SET clause and values array
  fields.forEach((field, index) => {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = $${values.length + 1}`);
      values.push(req.body[field]);
    }
  });

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields provided for update' });
  }

  try {
    // Add ID to values for WHERE clause
    values.push(id);

    const query = `UPDATE students SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ message: 'Student updated successfully', student: result.rows[0] });
  } catch (err) {
    console.error('Patch error:', err);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// ✅ DELETE a student
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM students WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found for deletion' });
    }

    res.status(200).json({ message: 'Student deleted successfully', student: result.rows[0] });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

module.exports = router;
