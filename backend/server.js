const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const authRoutes = require('./routes/authRoutes');
const initiativeRoutes = require('./routes/initiativeRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/initiatives', initiativeRoutes);
app.use('/api/feedback', feedbackRoutes);

// Serve frontend static files.
app.use(express.static(path.resolve(__dirname, '../frontend')));
app.get('*', (_req, res) => {
  res.sendFile(path.resolve(__dirname, '../frontend/index.html'));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
