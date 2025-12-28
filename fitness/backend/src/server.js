#!/usr/bin/env node
/**
 * Fitness App Backend Server
 * 
 * This is the main entry point for the fitness module backend.
 * Reads configuration from fitness/backend/.env (synced from fitness/master.env)
 */

// Load environment variables first - MUST be before any other imports
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

// ===============================
// ENVIRONMENT VALIDATION
// ===============================

/**
 * Validate that critical environment variables are set.
 * Throws error if missing - prevents silent failures.
 */
function validateEnvironment() {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'SESSION_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      'Missing required environment variables for Fitness app:\n' +
      `  ${missing.join(', ')}\n\n` +
      'Run \'cd fitness && ./env-sync.sh\' to populate from master.env'
    );
  }
  
  console.log('✓ Environment validation passed');
}

/**
 * Log environment configuration (without secrets)
 */
function logConfiguration() {
  console.log('\n=== Fitness Backend Configuration ===');
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`Database: ${process.env.DATABASE_URL ? 'Connected to Neon' : 'NOT SET'}`);
  console.log(`JWT Secret: ${process.env.JWT_SECRET ? '✓ Set' : 'MISSING'}`);
  console.log(`Session Secret: ${process.env.SESSION_SECRET ? '✓ Set' : 'MISSING'}`);
  console.log(`Frontend Base: ${process.env.FRONTEND_BASE || 'not set'}`);
  console.log('=====================================\n');
}

// ===============================
// INITIALIZATION
// ===============================

// Validate before starting
validateEnvironment();
logConfiguration();

// Initialize Prisma
const prisma = new PrismaClient();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5001;
const NODE_ENV = process.env.NODE_ENV || 'production';

// ===============================
// MIDDLEWARE
// ===============================

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_BASE || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/**
 * JWT Verification Middleware
 * Extracts and validates JWT token from Authorization header
 * Sets req.user if token is valid
 */
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // No token provided, allow request to continue (routes will handle 401 if needed)
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (error) {
    console.log(`JWT verification failed: ${error.message}`);
    // Don't set req.user, route middleware will catch this
  }
  
  next();
});

// ===============================
// ROUTES
// ===============================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'fitness-backend',
    timestamp: new Date().toISOString(),
    node_env: NODE_ENV,
  });
});

// Import fitness routes
const fitnessRoutes = require('../routes/fitness');
app.use('/api/fitness', fitnessRoutes);

// ===============================
// ERROR HANDLING
// ===============================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error('Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    error: err.name || 'Error',
    message: NODE_ENV === 'production' ? 'An error occurred' : message,
    timestamp: new Date().toISOString(),
  });
});

// ===============================
// SERVER STARTUP
// ===============================

async function start() {
  try {
    // Test database connection
    console.log('Testing database connection...');
    await prisma.$queryRaw`SELECT NOW()`;
    console.log('✓ Database connection successful\n');

    // Start server
    app.listen(PORT, () => {
      console.log(`🏃 Fitness Backend running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log('\nAPI Endpoints:');
      console.log('  GET    /api/fitness/profile');
      console.log('  POST   /api/fitness/profile');
      console.log('  GET    /api/fitness/workouts');
      console.log('  POST   /api/fitness/workouts');
      console.log('  GET    /api/fitness/goals');
      console.log('  POST   /api/fitness/goals\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:');
    console.error(error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start the server
start();

module.exports = app;
