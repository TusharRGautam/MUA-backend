const express = require('express');
const router = express.Router();
const dashboardServicesController = require('../controllers/dashboardServicesController');
const { authenticateJWT } = require('../middleware/auth');

// Simplified routes for debugging
// Salon Services Routes - only GET routes for now
router.get('/salon', (req, res) => {
  if (typeof dashboardServicesController.getSalonServices === 'function') {
    return dashboardServicesController.getSalonServices(req, res);
  }
  res.status(501).json({ message: "Not implemented yet" });
});

router.get('/salon/:id', (req, res) => {
  if (typeof dashboardServicesController.getSalonService === 'function') {
    return dashboardServicesController.getSalonService(req, res);
  }
  res.status(501).json({ message: "Not implemented yet" });
});

// PRP Services Routes - only GET routes for now
router.get('/prp', (req, res) => {
  if (typeof dashboardServicesController.getPrpServices === 'function') {
    return dashboardServicesController.getPrpServices(req, res);
  }
  res.status(501).json({ message: "Not implemented yet" });
});

router.get('/prp/:id', (req, res) => {
  if (typeof dashboardServicesController.getPrpService === 'function') {
    return dashboardServicesController.getPrpService(req, res);
  }
  res.status(501).json({ message: "Not implemented yet" });
});

// Diagnostics Services Routes - only GET routes for now
router.get('/diagnostics', (req, res) => {
  if (typeof dashboardServicesController.getDiagnosticsServices === 'function') {
    return dashboardServicesController.getDiagnosticsServices(req, res);
  }
  res.status(501).json({ message: "Not implemented yet" });
});

router.get('/diagnostics/:id', (req, res) => {
  if (typeof dashboardServicesController.getDiagnosticsService === 'function') {
    return dashboardServicesController.getDiagnosticsService(req, res);
  }
  res.status(501).json({ message: "Not implemented yet" });
});

module.exports = router; 