const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ShiftSchema = new Schema(
{
    period: {type: Schema.Types.ObjectId, ref:"Period", required: true},
    driver: {type: Schema.Types.ObjectId, ref:"Driver", required: true},
    taxi: {type: Schema.Types.ObjectId, ref:"Taxi", required: true},
});

ShiftSchema.virtual("url").get(function () {

    return `/shift/${this._id}`;
  });
  
  
  module.exports = mongoose.models.Shift || mongoose.model("Shift", ShiftSchema);