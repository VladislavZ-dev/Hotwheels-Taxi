const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");
const Trip = require("../models/trip");
const Period = require("../models/period");
const Address = require("../models/address");
const Route = require("../models/route");
const Person = require("../models/person");
const Driver = require("../models/driver");
const Taxi = require("../models/taxi");

exports.get_all_trips = asyncHandler(async (req, res, next) => {
    const trips = await Trip.find()
        .populate({
            path: "period"
        })
        .populate({
            path: "route",
            populate: [
                { path: "departure" },
                { path: "arrival" }
            ]
        })
        .populate({
            path: "driver"
        })
        .populate({
            path: "taxi"
        });

    res.status(200).json(trips);
});

exports.get_trips_by_driver = asyncHandler(async (req, res, next) => {

    const { nif } = req.params;
    
    const driverPerson = await Person.findOne({ nif }).exec();
    if (!driverPerson) {
      return res.status(404).json({ message: "Driver not found" });
    }

    const driver = await Driver.findOne({ person: driverPerson._id }).exec();
    if (!driver) {
      return res.status(404).json({ message: "Driver profile not found" });
    }

    const trips = await Trip.find({
        driver : driver._id
    })
        .populate({
            path: "period"
        })
        .populate({
            path: "route",
            populate: [
                { path: "departure" },
                { path: "arrival" }
            ]
        })
        .populate({
            path: "driver"
        })
        .populate({
            path: "taxi"
        });

    res.status(200).json(trips);
});


exports.register_new_trip = asyncHandler(async (req, res, next) => {
    try {
        const { numPeople, departure_address, arrival_address, departure_time, arrival_time, 
                driver_nif, taxi_plate, totalCost, distance, requestId, shift_id } = req.body;

        if (!numPeople || !departure_address || !arrival_address || !departure_time || 
            !arrival_time || !driver_nif || !totalCost || !distance || !taxi_plate) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const lastTrip = await Trip.findOne().sort({ sequence: -1 }).select("sequence");
        const sequence = lastTrip ? lastTrip.sequence + 1 : 1;

        const beginning = new Date(departure_time);
        const ending = new Date(arrival_time);
        
        const period = new Period({
            beginning: beginning,
            ending: ending,
        });
        await period.save();

        const timeDifference = Math.round((ending.getTime() - beginning.getTime()) / (1000 * 60));
        console.log("Time difference in minutes:", timeDifference);

        let departure = await Address.findOne(departure_address);
        if (!departure) {
            departure = new Address(departure_address);
            await departure.save();
        }

        let arrival = await Address.findOne(arrival_address);
        if (!arrival) {
            arrival = new Address(arrival_address);
            await arrival.save();
        }

        let route = await Route.findOne({ departure: departure._id, arrival: arrival._id });
        if (!route) {
            route = new Route({ 
                departure: departure._id, 
                arrival: arrival._id, 
                distanceTravelled: distance 
            });
            await route.save();
        }

        const new_driver = await Person.findOne({ nif: driver_nif });
        if (!new_driver) {
            return res.status(404).json({ error: "Driver not found with the provided NIF" });
        }
        
        const our_driver = await Driver.findOne({ person: new_driver._id });
        if (!our_driver) {
            return res.status(404).json({ error: "Driver record not found" });
        }

        const our_taxi = await Taxi.findOne({ licensePlate: taxi_plate });
        if (!our_taxi) {
            return res.status(404).json({ error: "Taxi not found with the provided license plate" });
        }

        const newTrip = new Trip({
            sequence,
            numPeople,
            period: period._id,
            route: route._id,
            totalCost,
            driver: our_driver._id,
            taxi: our_taxi._id,
            distance,
            time: timeDifference
        });

        await newTrip.save();

        if (requestId) {
            try {
            } catch (requestError) {
                console.error('Error updating request:', requestError);
            }
        }

        res.status(200).json({ 
            message: "Trip registered successfully", 
            trip: newTrip 
        });
        
    } catch (error) {
        console.error("Error registering trip:", error);
        res.status(500).json({ 
            error: "Failed to register trip", 
            details: error.message 
        });
    }
});

exports.get_trips_by_date_range = asyncHandler(async (req, res, next) => {
    
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ 
                error: "Missing required parameters", 
                message: "Both startDate and endDate are required" 
            });
        }

        const parseLocalDate = (dateString) => {

            if (dateString.includes('T') && dateString.includes('Z')) {

                return new Date(dateString);
            } else if (dateString.includes('T')) {
                const [datePart, timePart] = dateString.split('T');
                const [year, month, day] = datePart.split('-').map(Number);
                const [hours, minutes, seconds] = timePart.split(':').map(Number);
                return new Date(year, month - 1, day, hours, minutes, seconds || 0);
            } else {
                const [datePart, timePart] = dateString.includes(' ') ? 
                    dateString.split(' ') : [dateString, '00:00:00'];
                
                const [year, month, day] = datePart.split('-').map(Number);
                const [hours, minutes, seconds] = timePart.split(':').map(Number);
                
                return new Date(year, month - 1, day, hours, minutes, seconds || 0);
            }
        };

        const start = parseLocalDate(startDate);
        const end = parseLocalDate(endDate);

        console.log(`Parsed dates on server: ${start.toString()} to ${end.toString()}`);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ 
                error: "Invalid date format", 
                message: `Could not parse dates: "${startDate}" and "${endDate}"` 
            });
        }

        const periods = await Period.find({
            $or: [
                { beginning: { $gte: start, $lte: end } },
                { ending: { $gte: start, $lte: end } },
                { beginning: { $lte: start }, ending: { $gte: end } }
            ]
        }).select('_id beginning ending');

        console.log(`Found ${periods.length} matching periods`);
        
        if (periods.length > 0) {
            console.log("Sample periods:", 
                periods.slice(0, 3).map(p => ({
                    id: p._id,
                    beginning: p.beginning.toString(),
                    ending: p.ending.toString()
                }))
            );
        }

        const periodIds = periods.map(period => period._id);
        const trips = await Trip.find({
            period: { $in: periodIds }
        })
        .populate({
            path: "period"
        })
        .populate({
            path: "route",
            populate: [
                { path: "departure" },
                { path: "arrival" }
            ]
        })
        .populate({
            path: "driver",
            populate: { path: "person" }
        })
        .populate({
            path: "taxi"
        });

        console.log(`Found ${trips.length} trips for these periods`);

        res.status(200).json(trips);
        
    } catch (error) {
        console.error("Error fetching trips by date range:", error);
        res.status(500).json({ 
            error: "Failed to fetch trips", 
            details: error.message 
        });
    }
});