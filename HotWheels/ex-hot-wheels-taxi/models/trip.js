const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const TripSchema = new Schema(
{
    sequence: { type: Number, required: true, unique: true, min:1},
    numPeople:{ type: Number, required: true, min:1},
    period: {type: Schema.Types.ObjectId, ref:"Period", required: true},
    route: {type: Schema.Types.ObjectId, ref:"Route", required: true},
    totalCost: {type: Number, required: true, min: 0},
    driver: {type: Schema.Types.ObjectId, ref:"Driver", required: true},
    taxi: {type: Schema.Types.ObjectId, ref:"Taxi", required: true},
    distance: {type: Number, required: true},
    time: {type: Number, required: true}
});

TripSchema.virtual("url").get(function () {

    return `/trip${this._id}`;
  });
  
module.exports = mongoose.models.TripSchema || mongoose.model("Trip", TripSchema);