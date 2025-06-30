const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");
const Driver = require("../models/driver");
const Person = require("../models/person");
const Address = require("../models/address");

exports.register_new_driver = asyncHandler(async (req, res, next) => {
  const {
    person,
    birthYear,
    driversLicense,
    address,
  } = req.body;

  let existingPerson = await Person.findOne({ 
    nif: person.nif,
    gender: person.gender,
    name: person.name
   }).exec();
  if (!existingPerson) {
    existingPerson = new Person({nif : person.nif,name: person.name, gender: person.gender});
    await existingPerson.save();
  }

  let existingAddress = await Address.findOne({
    street: address.street,
    doorNumber: address.doorNumber,
    postCode: address.postCode
  }).exec();

  if (!existingAddress) {
    existingAddress = new Address({ street: address.street, doorNumber: address.doorNumber,postCode: address.postCode, locality: address.locality});
    await existingAddress.save();
  }

  const driver = new Driver({
    person: existingPerson._id,
    birthYear,
    driversLicense,
    address: existingAddress._id,
  });

  await driver.save();

  const populatedDriver = await Driver.findById(driver._id)
    .populate("person")
    .populate("address");

  res.status(201).json(populatedDriver);
});

exports.get_all_drivers = asyncHandler(async (req, res) => {
  const drivers = await Driver.find().populate('person').populate('address').exec();
  res.json(drivers);
});

exports.get_driver_by_nif = asyncHandler(async (req, res) => {
  const person = await Person.findOne({nif: req.params.nif}).exec();

  if (!person) {
    return res.status(404).json({ message: "Person with given NIF not found" });
  }

  const driver = await Driver.findOne({person : person._id}).populate(
    "person").populate("address").exec();

  if (!driver) {
    return res.status(404).json({ message: "Driver not found" });
  }

  res.json(driver);
});

exports.delete_driver_by_nif = asyncHandler(async (req, res) => {
  const nif = req.params.nif;
    try {
      const person = await Person.findOne({ nif: nif }).exec();

      if (!person) {
        return res.status(404).json({ message: "Person with given NIF not found" });
      }
    
      const driver = await Driver.findOneAndDelete({ person: person._id }).exec();
    
      if (!driver) {
        return res.status(404).json({ message: "Driver not found for the given NIF" });
      }
    
      res.json({ message: "Driver deleted successfully" });
    } catch (error) {
        console.error('Delete driver error:', error);
        res.status(500).json({ message: 'Error deleting driver', error: error.message });
    }
  
});


exports.update_driver_by_nif = asyncHandler(async (req, res) => {
  const { person, birthYear, driversLicense, address } = req.body;
  const { nif } = req.params;

  try {
    const driverPerson = await Person.findOne({ nif }).exec();
    if (!driverPerson) {
      return res.status(404).json({ message: "Driver not found" });
    }
  
    const driver = await Driver.findOne({ person: driverPerson._id }).exec();
    if (!driver) {
      return res.status(404).json({ message: "Driver profile not found" });
    }

    if (person) {
      await Person.findByIdAndUpdate(driverPerson._id, { $set: person });
    }

    if (address && driver.address) {
      await Address.findByIdAndUpdate(driver.address, { $set: address });
    }

    const driverUpdates = {};
    if (birthYear !== undefined) driverUpdates.birthYear = birthYear;
    if (driversLicense !== undefined) driverUpdates.driversLicense = driversLicense;
    
    if (Object.keys(driverUpdates).length > 0) {
      await Driver.findByIdAndUpdate(driver._id, { $set: driverUpdates });
    }

    const updatedDriver = await Driver.findById(driver._id)
      .populate("person")
      .populate("address")
      .exec();

    res.json(updatedDriver);
  } catch (error) {
    console.error('Update driver error:', error);
    res.status(500).json({ 
      message: 'Error updating driver', 
      error: error.message 
    });
  }
});