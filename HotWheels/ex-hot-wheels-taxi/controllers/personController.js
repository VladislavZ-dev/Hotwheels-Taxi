const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");
const Person = require("../models/person");

exports.get_people = asyncHandler(async (req, res, next) => {
    const people = await Person.find().exec();
    res.status(200).json(people);
});

exports.find_person_by_id = asyncHandler(async (req, res, next) => {
    const person = await Person.findById(req.params.id).exec();
    if (!person) {
        return res.status(404).json({ message: 'Person not found' });
    }
    res.status(200).json(person);
});

exports.register_new_person = asyncHandler(async (req, res, next) => {
    const {nif, gender, name} = req.body;
    const person = new Person(nif, gender, name);
    await person.save();
    res.status(201).json(person);
    next();
});