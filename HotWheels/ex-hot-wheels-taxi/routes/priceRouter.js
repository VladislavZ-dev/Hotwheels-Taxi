const express = require("express");
const router = express.Router();
const price_controller = require("../controllers/priceController");

router.post("/prices", price_controller.register_new_prices);

router.get("/prices", price_controller.get_price_table);

router.put("/prices", price_controller.update_price_table);

router.get("/price/basic", price_controller.get_basic);
router.get("/price/luxurious", price_controller.get_luxurious);
router.get("/price/nightFee", price_controller.get_NightFee);

router.put("/price/basic", price_controller.update_basic);
router.put("/price/luxurious", price_controller.update_luxurious);
router.put("/price/nightFee", price_controller.update_NightFee);

module.exports = router;