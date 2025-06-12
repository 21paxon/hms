const express = require('express');
const router = express.Router();
const pool = require('../db');

// 🟩 Get all rooms
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rooms ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching rooms:', err.message);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// 🟩 Get available rooms (unallocated)
router.get('/available', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rooms WHERE student_id IS NULL ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching available rooms:', err.message);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// 🟨 Get a room by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM rooms WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Room not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching room:', err.message);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// 🟩 Create a new room
router.post('/', async (req, res) => {
  const { room_number, type, capacity, price_per_month, status } = req.body;

  if (!room_number || !type || !capacity || !price_per_month || !status) {
    return res.status(400).json({ status: 'error', message: 'Missing required fields' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO rooms (room_number, type, capacity, price_per_month, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [room_number, type, capacity, price_per_month, status]
    );

    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('Error creating room:', err.message);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// 🟨 Update room details
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { room_number, type, capacity, price_per_month, status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE rooms
       SET room_number = $1,
           type = $2,
           capacity = $3,
           price_per_month = $4,
           status = $5
       WHERE id = $6
       RETURNING *`,
      [room_number, type, capacity, price_per_month, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Room not found' });
    }

    res.json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('Error updating room:', err.message);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// 🟥 Delete a room
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM rooms WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Room not found' });
    }

    res.json({ status: 'success', message: 'Room deleted successfully' });
  } catch (err) {
    console.error('Error deleting room:', err.message);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// 🟪 Allocate a student to a room
router.post('/:roomId/allocate/:studentId', async (req, res) => {
  const { roomId, studentId } = req.params;
  console.log(`Allocating student ${studentId} to room ${roomId}`);

  try {
    const result = await pool.query(
      `UPDATE rooms SET student_id = $1 WHERE id = $2 RETURNING *`,
      [studentId, roomId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Room not found' });
    }

    res.json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('❌ Allocation failed:', err.stack);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});


module.exports = router;
