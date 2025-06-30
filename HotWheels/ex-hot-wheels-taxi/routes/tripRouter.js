const express = require("express");
const router = express.Router();
const trip_controller = require("../controllers/tripController");

router.get("/trips/by-date", trip_controller.get_trips_by_date_range);

router.get('/trips', trip_controller.get_all_trips);

router.get('/trips/:nif', trip_controller.get_trips_by_driver);

router.post("/trip", trip_controller.register_new_trip);


module.exports = router;