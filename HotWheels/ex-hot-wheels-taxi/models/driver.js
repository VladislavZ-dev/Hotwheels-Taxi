const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const currentYear = new Date().getFullYear();

const DriverSchema = new Schema({
  person: { type: Schema.Types.ObjectId, ref: "Person", required: true },
  birthYear: {
    type: Number,
    required: true,
    min: 1900,
    validate: {
      validator: function(year) {
        return (currentYear - year) >= 18;
      },
      message: "Driver must be at least 18 years old"
    }
  },
  driversLicense: { type: String, required: true, unique: true },
  address: { type: Schema.Types.ObjectId, ref: "Address", required: true }
});

DriverSchema.virtual("url").get(function() {
  return `/driver/${this._id}`;
});

module.exports = mongoose.models.Driver || mongoose.model('Driver', DriverSchema);