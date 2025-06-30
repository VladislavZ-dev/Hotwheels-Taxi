const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RequestSchema = new Schema({
  customer: { type: Schema.Types.ObjectId, ref: "Person", required: true },
  pickup: {
    address: { type: Schema.Types.ObjectId, ref: "Address", required: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  destination: {
    address: { type: Schema.Types.ObjectId, ref: "Address", required: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  passengers: { type: Number, required: true },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'driver_accepted', 'client_confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  distance: {type: Number },
  priceEstimate: { type: Number },
  driver: {
    info: { type: Schema.Types.ObjectId, ref: "Driver" },
    estimatedArrival: { type: Number } 
  },
  comfort: { type: String, required: true },
  timestamps: {
    requested: { type: Date, required: true, default: Date.now },
    driverAccepted: { type: Date },
    clientConfirmed: { type: Date },
    completed: { type: Date }
  }
});

RequestSchema.virtual("url").get(function() {
  return `/request/${this._id}`;
});

module.exports = mongoose.models.Request || mongoose.model('Request', RequestSchema);