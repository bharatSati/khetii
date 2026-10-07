require('dotenv').config();
const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route handlers
const authRoutes = require('./routes/authRoutes');
const schemeRoutes = require('./routes/schemeRoutes');
const insuranceRoutes = require('./routes/insuranceRoutes');
const marketRoutes = require('./routes/marketRoutes');
const marketplaceRoutes = require('./routes/marketplaceRoutes');
const financeRoutes = require('./routes/financeRoutes');
const ocrRoutes = require('./routes/ocrRoutes');
const knowledgeRoutes = require('./routes/knowledgeRoutes');
const searchRoutes = require('./routes/searchRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const postRoutes = require('./routes/postRoutes');
const kccRoutes = require('./routes/kccRoutes');

const app = express();

// Middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Kheti Backend API',
    time: new Date().toISOString()
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/kcc', kccRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/samvaad', postRoutes);
app.use('/api/posts', postRoutes);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: `API endpoint ${req.originalUrl} not found.` });
});

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`  🌾 KHETI Server running on port ${PORT}`);
      console.log(`  🌾 API base: http://localhost:${PORT}/api`);
      console.log(`===============================================`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        const altPort = Number(PORT) + 1;
        console.warn(`[Server] Port ${PORT} is in use (e.g. AirPlay). Trying fallback port ${altPort}...`);
        app.listen(altPort, () => {
          console.log(`===============================================`);
          console.log(`  🌾 KHETI Server running on port ${altPort}`);
          console.log(`  🌾 API base: http://localhost:${altPort}/api`);
          console.log(`===============================================`);
        });
      } else {
        console.error('Server error:', err);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
