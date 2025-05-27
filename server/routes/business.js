const express = require('express');
const router = express.Router();

// Example: GET /api/business/health
router.get('/health', (req, res) => {
  res.json({ status: 'business route ok' });
});

module.exports = router; 