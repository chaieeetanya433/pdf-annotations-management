require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db.js');

const uploadRoutes = require('./routes/uploadRoutes.js');
const annotationRoutes = require('./routes/annotationRoutes.js');

const app = express();
app.use(cors());
app.use(express.json());

// Connect DB
connectDB();

// Routes
app.use('/api', uploadRoutes);
app.use('/api', annotationRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
