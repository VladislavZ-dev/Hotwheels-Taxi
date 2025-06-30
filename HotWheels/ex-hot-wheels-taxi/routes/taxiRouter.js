const express = require("express");
const router = express.Router();
const taxi_controller = require("../controllers/taxiController");

router.post("/taxi", taxi_controller.register_new_taxi);

router.get('/taxis', taxi_controller.get_all_taxis);

router.get('/taxi/:licensePlate', taxi_controller.get_taxi_by_licensePlate);

router.get('/taxi/:licensePlate/has-made-trips', taxi_controller.has_taxi_made_trips);

router.delete('/taxi/:licensePlate', taxi_controller.delete_taxi_by_licensePlate);

router.put('/taxi/:licensePlate', taxi_controller.update_taxi_by_licensePlate);

module.exports = router;