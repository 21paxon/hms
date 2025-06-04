// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Route files
const userRoutes = require('./routes/userroutes');
const studentRoutes = require('./routes/studentroutes');
const roomRoutes = require('./routes/roomRoutes');

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/rooms', roomRoutes);

// Fallback for unknown routes (Optional)
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
