const express = require("express");
const router = express.Router();

const address_controller = require("../controllers/addressController");
const branchOffice_controller = require("../controllers/branchOfficeController");
const client_controller = require("../controllers/clientController");
const driver_controller = require("../controllers/driverController");
const period_controller = require("../controllers/periodController");
const receipt_controller = require("../controllers/receiptController");
const route_controller = require("../controllers/routeController");
const shift_controller = require("../controllers/shiftController");

const trip_controller = require("../controllers/tripController");

router.get("/taxis", taxi_controller.taxi);

module.exports = router;
