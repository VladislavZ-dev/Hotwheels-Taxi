const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");
const Address = require("../models/address");

exports.register_new_address = asyncHandler(async (req, res, next) => {
    const {id, street, doorNumber, postCode, locality} = req.body;
    const address = new Address(id, street, doorNumber, postCode, locality);
    await address.save();
    res.status(201).json(address);
});