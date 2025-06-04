const express = require('express');
const router = express.Router();
const pool = require('../db'); // Adjust path if needed

// GET all rooms
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rooms ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching rooms:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET one room by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM rooms WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Room not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error fetching room:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST create room
router.post('/', async (req, res) => {
  const {
    room_number,
    type,
    capacity,
    price_per_month,
    status
  } = req.body;

  try {
    const insertQuery = `
      INSERT INTO rooms (room_number, type, capacity, price_per_month, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [room_number, type, capacity, price_per_month, status];
    const result = await pool.query(insertQuery, values);

    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('❌ Error inserting room:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// PUT update room
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    room_number,
    type,          
    capacity,
    price_per_month,
    status
  } = req.body;

  try {
    const updateQuery = `
      UPDATE rooms
      SET room_number = $1,
          type = $2,
          capacity = $3,
          price_per_month = $4,
          status = $5
      WHERE id = $6
      RETURNING *;
    `;
    const values = [room_number, type, capacity, price_per_month, status, id];
    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Room not found' });
    }

    res.json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('❌ Error updating room:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// DELETE room
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM rooms WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Room not found' });
    }

    res.json({ status: 'success', message: 'Room deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting room:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
