const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");
const Taxi = require("../models/taxi");
const Shift = require("../models/shift");
const Trip = require("../models/trip");

exports.register_new_taxi = asyncHandler(async (req, res, next) => {
  const { licensePlate, acquisitionYear, brand, model, confortLevel } = req.body;
  const taxi = new Taxi({ licensePlate, acquisitionYear, brand, model, confortLevel });
  await taxi.save();
  res.status(201).json(taxi);
});

exports.get_all_taxis = async (req, res) => {
  const taxis = await Taxi.find().exec();
  res.json(taxis);
};

exports.update_taxi_by_licensePlate = async (req, res) => {
  const { acquisitionYear, brand, model, confortLevel } = req.body;
  const licensePlate = req.params.licensePlate;
  
  try {
    const taxi = await Taxi.findOne({ licensePlate: licensePlate });
    
    if (!taxi) {
      return res.status(404).json({ message: 'Taxi not found' });
    }
    
    const updateData = {
      acquisitionYear,
      brand,
      model
    };
    
    if (confortLevel !== undefined && confortLevel !== taxi.confortLevel) {

      const shifts = await Shift.find({ taxi: taxi._id });
      
      if (shifts.length === 0) {
        updateData.confortLevel = confortLevel;
      } else {
        let hasMadeTrips = false;
        
        for (const shift of shifts) {
          const trips = await Trip.find({
            driver: shift.driver,
            period: shift.period
          });
          
          if (trips.length > 0) {
            hasMadeTrips = true;
            break;
          }
        }
        
        if (hasMadeTrips) {
          return res.status(403).json({
            message: 'Cannot update comfort level because this taxi has already made trips with clients'
          });
        } else {
          updateData.confortLevel = confortLevel;
        }
      }
    } else if (confortLevel !== undefined) {
      updateData.confortLevel = confortLevel;
    }
    
    const updatedTaxi = await Taxi.findOneAndUpdate(
      { licensePlate: licensePlate },
      updateData,
      { new: true }
    );
    
    res.json(updatedTaxi);
    
  } catch (error) {
    console.error('Update taxi error:', error);
    res.status(500).json({ message: 'Error updating taxi', error: error.message });
  }
};

exports.get_taxi_by_licensePlate = async (req, res) => {
  const taxi = await Taxi.findOne({ licensePlate: req.params.licensePlate }).exec();
  if (!taxi) {
    return res.status(404).json({ message: 'Taxi not found' });
  }
  res.json(taxi);
};

exports.delete_taxi_by_licensePlate = async (req, res) => {
  const licensePlate = req.params.licensePlate;
  
  try {
    const taxi = await Taxi.findOne({ licensePlate: licensePlate });
    
    if (!taxi) {
      return res.status(404).json({ message: 'Taxi not found' });
    }
    
    const shifts = await Shift.find({ taxi: taxi._id });
    
    if (shifts.length > 0) {
      return res.status(403).json({ 
        message: 'Cannot delete this taxi because it has already been assigned to driver shifts',
        shifts: shifts.length
      });
    }

    const deletedTaxi = await Taxi.findOneAndDelete({ licensePlate: licensePlate });
    res.json(deletedTaxi);
    
  } catch (error) {
    console.error('Delete taxi error:', error);
    res.status(500).json({ message: 'Error deleting taxi', error: error.message });
  }
};

exports.has_taxi_made_trips = async (req, res) => {
  const licensePlate = req.params.licensePlate;
  
  try {

    const taxi = await Taxi.findOne({ licensePlate: licensePlate });
    
    if (!taxi) {
      return res.status(404).json({ message: 'Taxi not found' });
    }
    const tripExists = await Trip.exists({ taxi: taxi._id });
    
    res.json({ hasMadeTrips: tripExists });
    
  } catch (error) {
    console.error('Error checking if taxi has made trips:', error);
    res.status(500).json({ 
      message: 'Error checking if taxi has made trips', 
      error: error.message 
    });
  }
};