const express = require('express');
const applicationRoutes = require('./routes/applicationRoutes');

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use('/api/applications', applicationRoutes);

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'Invalid JSON request body' });
  }

  console.error(error);
  return res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
