const express = require("express");
const router = express.Router();
const driver_controller = require("../controllers/driverController");

router.post("/driver", driver_controller.register_new_driver);

router.get('/drivers', driver_controller.get_all_drivers);

router.get('/driver/:nif', driver_controller.get_driver_by_nif);

router.delete('/driver/:nif', driver_controller.delete_driver_by_nif);

router.put('/driver/:nif', driver_controller.update_driver_by_nif);

module.exports = router;