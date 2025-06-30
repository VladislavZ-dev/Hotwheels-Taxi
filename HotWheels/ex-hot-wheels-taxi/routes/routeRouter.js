const express = require('express');
const router = express.Router();
const route_controller = require('../controllers/routeController');

router.get('/routes', route_controller.getAllRoutes);
router.get('/routes/date-range', route_controller.getRoutesByDateRange);
router.get('/route/total-distance', route_controller.getTotalDistance);

module.exports = router;