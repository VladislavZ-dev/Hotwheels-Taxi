const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");
const Taxi = require("../models/taxi");
const Period = require("../models/period");
const Shift = require("../models/shift");
const Driver = require("../models/driver");
const Person = require("../models/person");

exports.get_all_shifts = asyncHandler(async (req, res, next) => {
    const shifts = await Shift.find().exec();
    res.json(shifts);
});

exports.get_future_shifts = asyncHandler(async (req, res, next) => {
    const now = new Date();
    const { driverNif } = req.query;
    
    const query = {};
    if (driverNif) {
        const person = await Person.findOne({ nif: Number(driverNif) }).exec();
        
        if (!person) {
            return res.status(404).json({ message: 'Person with that NIF not found' });
        }

        const driver = await Driver.findOne({ person: person._id }).exec();
        
        if (!driver) {
            return res.status(404).json({ message: 'Driver associated with that NIF not found' });
        }
        
        query.driver = driver._id;
    }
    
    const futureShifts = await Shift.find(query)
        .populate({
            path: 'period',
            match: { beginning: { $gt: now } }
        })
        .populate('driver')
        .populate('taxi')
        .exec();
    
    const filteredShifts = futureShifts.filter(shift => shift.period !== null);
    res.json(filteredShifts);
});


exports.get_past_shifts = asyncHandler(async (req, res, next) => {
    const now = new Date();
    const { driverNif } = req.query;
    
    const query = {};
    if (driverNif) {
        const person = await Person.findOne({ nif: Number(driverNif) }).exec();
        
        if (!person) {
            return res.status(404).json({ message: 'Person with that NIF not found' });
        }

        const driver = await Driver.findOne({ person: person._id }).exec();
        
        if (!driver) {
            return res.status(404).json({ message: `Driver associated with that NIF not found` });
        }
        
        query.driver = driver._id;
    }
    
    const pastShifts = await Shift.find(query)
        .populate({
            path: 'period',
            match: { ending: { $lt: now } }
        })
        .populate('driver')
        .populate('taxi')
        .exec();
    
    const filteredShifts = pastShifts.filter(shift => shift.period !== null);
    res.json(filteredShifts);
});

exports.get_ongoing_shifts = asyncHandler(async (req, res, next) => {
    const now = new Date();
    const { driverNif } = req.query;
    
    const query = {};
    if (driverNif) {
        const person = await Person.findOne({ nif: Number(driverNif) }).exec();
        
        if (!person) {
            return res.status(404).json({ message: 'Person with that NIF not found' });
        }

        const driver = await Driver.findOne({ person: person._id }).exec();
        
        if (!driver) {
            return res.status(404).json({ message: 'Driver associated with that NIF not found' });
        }
        
        query.driver = driver._id;
    }
    
    const ongoingShifts = await Shift.find(query)
        .populate({
            path: 'period',
            match: { 
                beginning: { $lte: now },
                ending: { $gt: now }      
            }
        })
        .populate('driver')
        .populate('taxi')
        .exec();
    
    const filteredShifts = ongoingShifts.filter(shift => shift.period !== null);
    res.json(filteredShifts);
});

exports.get_available_taxis = asyncHandler(async (req, res, next) => {
    const { beginningHour, endingHour } = req.query;

    if (!beginningHour || !endingHour) {
        return res.status(400).json({ message: 'Both beginningHour and endingHour are required.' });
    }

    const beginning = new Date(beginningHour);
    const ending = new Date(endingHour);

    if (isNaN(beginning.getTime()) || isNaN(ending.getTime())) {
        return res.status(400).json({ message: 'Invalid date format for beginningHour or endingHour.' });
    }

    const overlappingPeriods = await Period.find({
        $or: [
            { beginning: { $lt: ending }, ending: { $gt: beginning } }
        ]
    }).exec();

    const conflictingShifts = await Shift.find({
        period: { $in: overlappingPeriods.map(p => p._id) }
    }).populate('period').exec();

    const trulyConflictingShifts = conflictingShifts.filter(shift => {
        const shiftStart = shift.period.beginning;
        const shiftEnd = shift.period.ending;
        return beginning < shiftEnd && ending > shiftStart;
    });

    const busyTaxiIds = trulyConflictingShifts.map(shift => shift.taxi);

    const availableTaxis = await Taxi.find({
        _id: { $nin: busyTaxiIds }
    }).exec();

    res.json(availableTaxis);
});

exports.create_new_shift = asyncHandler(async (req, res, next) => {
    const {
        period,
        driver,
        taxi
    } = req.body;
    
    let newPeriod = new Period({
        beginning: period.beginning,
        ending: period.ending
    });
    await newPeriod.save();

    let existingDriver = await Driver.findOne({ 
        driversLicense : driver.driversLicense
    }).exec();

    if (!existingDriver) {
        return res.status(404).json({ message: 'Driver not found' });
    }

    let existingTaxi = await Taxi.findOne({ licensePlate: taxi.licensePlate }).exec();

    if (!existingTaxi) {
        return res.status(404).json({ message: 'Taxi not found' });
    }

    const shift = new Shift({
        period: newPeriod,
        driver: existingDriver,
        taxi: existingTaxi,
    });

    await shift.save();

    res.status(201).json(shift);
});


exports.checkDriverAvailability = asyncHandler(async (req, res) => {
    try {
        const { driversLicense, start, end } = req.query;

        const startDate = new Date(start);
        const endDate = new Date(end);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid date format' 
            });
        }

        const driver = await Driver.findOne({ driversLicense }).exec();
        if (!driver) {
            return res.status(404).json({ 
                success: false,
                message: 'Driver not found' 
            });
        }
        
        const allDriverShifts = await Shift.find({ driver: driver._id }).exec();
        const overlappingShifts = [];
        
        for (const shift of allDriverShifts) {
            let shiftStart, shiftEnd;
            
            if (shift.period) {
                if (typeof shift.period.beginning !== 'undefined' && typeof shift.period.ending !== 'undefined') {
                    shiftStart = new Date(shift.period.beginning);
                    shiftEnd = new Date(shift.period.ending);
                } else if (typeof shift.period === 'object' && shift.period !== null) {
                    await shift.populate('period');
                    if (shift.period && shift.period.beginning && shift.period.ending) {
                        shiftStart = new Date(shift.period.beginning);
                        shiftEnd = new Date(shift.period.ending);
                    }
                }

            } else if (shift.beginning && shift.ending) {
                shiftStart = new Date(shift.beginning);
                shiftEnd = new Date(shift.ending);
            }
            
            if (!shiftStart || !shiftEnd) {
                continue;
            }

            const hasOverlap = (
                (shiftStart <= startDate && shiftEnd > startDate) ||
                (shiftStart < endDate && shiftEnd >= endDate) ||
                (startDate <= shiftStart && endDate >= shiftEnd)
            );
            
            if (hasOverlap) {
                overlappingShifts.push(shift);
            }
        }
        
        return res.json({
            success: true,
            hasOverlap: overlappingShifts.length > 0,
            overlaps: overlappingShifts,
            message: overlappingShifts.length > 0 ? 'Overlapping shifts found' : 'No overlaps found'
        });

    } catch (error) {
        console.error('Availability check error:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Internal server error'
        });
    }
});