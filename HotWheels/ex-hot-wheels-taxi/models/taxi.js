const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const TaxiSchema = new Schema(
{
    licensePlate: { type: String, required: true},
    shift: {type: Schema.Types.ObjectId, ref: "Shift"},
    acquisitionYear: {type: Number, required: true},
    brand: {type: String, required: true},
    model: {type: String, required: true},
    branchOffice: {type: Schema.Types.ObjectId, ref: "BranchOffice"},
    confortLevel: {type: String, enum: ["luxury","basic"], required: true}
});

TaxiSchema.virtual("url").get(function () {
    return `/taxi${this._id}`;
  });
  
  
  module.exports = mongoose.models.Taxi ||mongoose.model("Taxi", TaxiSchema);