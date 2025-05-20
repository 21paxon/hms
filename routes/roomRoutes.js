// routes/roomRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all rooms
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rooms');
    res.status(200).json({
      status: 'success',
      data: result.rows,
    });
  } catch (err) {
    console.error('❌ Error fetching rooms:', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch rooms' });
  }
});

module.exports = router;
