const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");
const Request = require("../models/request");
const Person = require("../models/person");
const Address = require("../models/address");
const Driver = require("../models/driver");
const driverController = require("./driverController");

exports.register_new_request = asyncHandler(async (req, res, next) => {
    const {
      customer, 
      pickup, 
      destination,
      passengers,
      comfort,
      distance,
      priceEstimate
    } = req.body;
  
    try {
      if (!customer || !pickup || !destination || !passengers || !comfort) {
        return res.status(400).json({ message: "Missing required fields" });
      }
  
      let existingCustomer = await Person.findOne({ 
        nif: customer.nif
      }).exec();
      
      if (!existingCustomer) {
        existingCustomer = new Person(customer);
        await existingCustomer.save();
      }
  
      const pickupAddress = await Address.findOneAndUpdate(
        {
          street: pickup.address.street,
          doorNumber: pickup.address.doorNumber,
          postCode: pickup.address.postCode
        },
        pickup.address,
        { upsert: true, new: true }
      );
  
      const destinationAddress = await Address.findOneAndUpdate(
        {
          street: destination.address.street,
          doorNumber: destination.address.doorNumber,
          postCode: destination.address.postCode
        },
        destination.address,
        { upsert: true, new: true }
      );
  
      const request = new Request({
        customer: existingCustomer._id,
        pickup: {
          address: pickupAddress._id,
          coordinates: pickup.coordinates
        },
        destination: {
          address: destinationAddress._id,
          coordinates: destination.coordinates
        },
        passengers,
        comfort,
        distance,
        priceEstimate,
        status: 'pending',
        timestamps: {
          requested: new Date()
        }
      });
  
      await request.save();
  
      const populatedRequest = await Request.findById(request._id)
        .populate("customer")
        .populate("pickup.address")
        .populate("destination.address");
  
      res.status(201).json(populatedRequest);
    } catch (error) {
      console.error("Error creating request:", error);
      res.status(500).json({ 
        message: "Error creating request",
        error: error.message 
      });
    }
  });

exports.get_all_requests = asyncHandler(async (req, res) => {
    const { status, lat, lng } = req.query;
    const filter = status ? { status } : {};
    
    let requests = await Request.find(filter)
      .populate('customer')
      .populate('pickup.address')
      .populate('destination.address')
      .populate('driver.info')
      .exec();
  
    if (lat && lng) {
      requests = requests.map(request => {
        if (request.pickup.coordinates) {
          const distance = calculateDistance(
            parseFloat(lat),
            parseFloat(lng),
            request.pickup.coordinates.lat,
            request.pickup.coordinates.lng
          );
          request.distance = distance;
        }
        return request;
      });
  
      requests.sort((a, b) => {
        if (a.distance === 0 && b.distance !== 0) return -1;
        if (b.distance === 0 && a.distance !== 0) return 1;

        return (a.distance || Infinity) - (b.distance || Infinity);
      });
    
    }
      
    res.json(requests);
  });

  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
}


exports.get_all_driver_requests_by_nif = asyncHandler(async (req, res) => {
    const { nif } = req.params;
    console.log('Searching for driver with NIF:', nif);
  
    const driverPerson = await Person.findOne({ nif }).exec();
    if (!driverPerson) {
      return res.status(404).json({ message: "Driver not found" });
    }
  
    const driver = await Driver.findOne({ person: driverPerson._id }).exec();
    if (!driver) {
      return res.status(404).json({ message: "Driver profile not found" });
    }
  
    const requests = await Request.find({ 
      'driver.info': driver._id 
    })
      .populate('customer')
      .populate('pickup.address')
      .populate('destination.address')
      .populate({
        path: 'driver.info',
        populate: {
          path: 'person',
          model: 'Person'
        }
      })
      .lean();
  
    console.log('Found driver requests:', requests);
    res.json(requests);
  });

  exports.get_all_requests_by_nif = asyncHandler(async (req, res) => {
    const { nif } = req.params;
    
    const customer = await Person.findOne({ nif }).exec();
    
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    
    const requests = await Request.find({ 
      customer: customer._id,
      status: { $in: ['pending', 'driver_accepted', 'client_confirmed', 'completed', 'cancelled'] } 
    })

    .populate('customer')
    .populate('pickup.address')
    .populate('destination.address')
    
    .populate({
      path: 'driver.info',
      populate: {
        path: 'person',
        model: 'Person'
      }
    })
    .exec();
    res.json(requests);
  });

exports.delete_request_by_id = asyncHandler(async (req, res) => {
    
    const request = await Request.findByIdAndDelete(req.params.id).exec();
  
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
  
    res.json({ 
      message: "Request cancelled successfully",
      cancelledRequest: request
    });
  });

exports.get_request_by_id = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id)
    .populate("customer")
    .populate("pickup.address")
    .populate("destination.address")
    .populate("driver.info")
    .exec();

  if (!request) {
    return res.status(404).json({ message: "Request not found" });
  }

  res.json(request);
});

exports.get_pending_requests_by_nif = asyncHandler(async (req, res) => {
    const { nif } = req.params;
    
    const customer = await Person.findOne({ nif }).exec();
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
  
    const requests = await Request.find({ 
      customer: customer._id,
      status: 'pending'
    })
    .populate('customer')
    .populate('pickup.address')
    .populate('destination.address')
    .populate('driver.info')
    .exec();
  
    res.json(requests);
  });

exports.get_driver_accepted_requests_by_nif = asyncHandler(async (req, res) => {
    const { nif } = req.params;
    
    const customer = await Person.findOne({ nif }).exec();
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
  
    const requests = await Request.find({ 
      customer: customer._id,
      status: 'driver_accepted'
    })
    .populate('customer')   
    .populate('pickup.address')
    .populate('destination.address')
    .populate('driver.info')
    .exec();
  
    res.json(requests);
});

exports.client_rejects_driver = asyncHandler(async (req, res) => {
    const request = await Request.findByIdAndUpdate(
      req.params.id,
      {
        status: 'pending',
        $unset: {
          'driver': 1,
          'timestamps.driverAccepted': 1
        }
      },
      { new: true }
    )
    .populate("customer")
    .populate("pickup.address")
    .populate("destination.address")
    .populate("driver.info")
    .exec();
  
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
  
    res.json(request);
  });

  exports.driver_accepts_request = asyncHandler(async (req, res) => {
    const { driverId, estimatedArrival } = req.body;
    const id = req.params.id;
  
    const arrivalTime = Number(estimatedArrival);
    if (isNaN(arrivalTime)) {
      return res.status(400).json({ 
        message: "estimatedArrival must be a number (minutes until arrival)" 
      });
    }

    const driver = await Driver.findById(driverId).exec();
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    const request = await Request.findByIdAndUpdate(
      id,
      {
        status: 'driver_accepted',
        driver: {
          info: driver._id,
          estimatedArrival: arrivalTime 
        },
        'timestamps.driverAccepted': new Date()
      },
      { new: true }
    )
    .populate("customer")
    .populate("pickup.address")
    .populate("destination.address")
    .populate("driver.info")
    .exec();

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    res.json(request);
});

exports.client_confirms_request = asyncHandler(async (req, res) => {
  const request = await Request.findByIdAndUpdate(
    req.params.id,
    {
      status: 'client_confirmed',
      'timestamps.clientConfirmed': new Date()
    },
    { new: true }
  )
  .populate("customer")
  .populate("pickup.address")
  .populate("destination.address")
  .populate("driver.info")
  .exec();

  if (!request) {
    return res.status(404).json({ message: "Request not found" });
  }

  res.json(request);
});

exports.complete_request = asyncHandler(async (req, res) => {
  const request = await Request.findByIdAndUpdate(
    req.params.id,
    {
      status: 'completed',
      'timestamps.completed': new Date()
    },
    { new: true }
  )
  .populate("customer")
  .populate("pickup.address")
  .populate("destination.address")
  .populate("driver.info")
  .exec();

  if (!request) {
    return res.status(404).json({ message: "Request not found" });
  }

  res.json(request);
});

exports.update_request = asyncHandler(async (req, res) => {
    const { id, ...updateData } = req.body;
    
    const request = await Request.findByIdAndUpdate(id, updateData, { new: true })
      .populate("customer")
      .populate("pickup.address")
      .populate("destination.address")
      .populate("driver.info")
      .exec();
  
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
  
    res.json(request);
  });