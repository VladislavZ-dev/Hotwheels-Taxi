const express = require("express");
const router = express.Router();
const request_controller = require("../controllers/requestController");

router.post("/request", request_controller.register_new_request);
router.patch('/request/:id/complete', request_controller.complete_request); 

router.get('/requests/:nif', request_controller.get_all_requests_by_nif);
router.get('/driver-requests/:nif', request_controller.get_all_driver_requests_by_nif);
router.get('/request/pending/:nif', request_controller.get_pending_requests_by_nif);
router.get('/request/accepted/:nif', request_controller.get_driver_accepted_requests_by_nif);
router.get('/request/:id', request_controller.get_request_by_id);
router.get('/requests', request_controller.get_all_requests);

router.patch('/request/:id/accept', request_controller.driver_accepts_request);
router.patch('/request/:id/reject', request_controller.client_rejects_driver);
router.patch('/request/:id/confirm', request_controller.client_confirms_request);

router.put('/request', request_controller.update_request);

router.delete('/request/:id', request_controller.delete_request_by_id);

module.exports = router;