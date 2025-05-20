const express = require('express');
const app = express();

const roomRoutes = require('./routes/roomRoutes');
const userRoutes = require('./routes/userroutes');  // <--- This line must exist

app.use(express.json());

app.use('/rooms', roomRoutes);
app.use('/api/users', userRoutes);  // <--- Now userRoutes is defined here

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
