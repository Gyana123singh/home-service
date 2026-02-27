const express = require("express");
const router = express.Router();
const offerController = require("../../controllers/admin/offerController");

router.post("/create-global-offer", offerController.createGlobalOffer);
router.patch("/toggle-offer/:id", offerController.toggleOfferStatus);
router.get("/all-offers", offerController.getAllOffers);

module.exports = router;
