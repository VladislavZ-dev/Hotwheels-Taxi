const express = require("express");
const router = express.Router();
const shift_controller = require("../controllers/shiftController");

router.get("/shift/available-taxis", shift_controller.get_available_taxis);

router.get("/shifts", shift_controller.get_all_shifts);

router.get("/shifts/future", shift_controller.get_future_shifts);

router.get("/shifts/past", shift_controller.get_past_shifts);

router.get("/shifts/ongoing", shift_controller.get_ongoing_shifts);

router.get('/shifts/check-availability', shift_controller.checkDriverAvailability);

router.post("/shift", shift_controller.create_new_shift);

module.exports = router;