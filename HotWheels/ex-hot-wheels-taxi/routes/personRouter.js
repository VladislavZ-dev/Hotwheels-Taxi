const express = require("express");
const router = express.Router();
const person_controller = require("../controllers/personController");

router.get("/person/:id", person_controller.find_person_by_id);

module.exports = router;