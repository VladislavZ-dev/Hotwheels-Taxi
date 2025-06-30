const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const PeriodSchema = new Schema(
{
    beginning: { type: Date, required: true},
    ending: {type: Date, required: true},
});

PeriodSchema.virtual("url").get(function () {

    return `/period${this._id}`;
  });
  
  
  module.exports = mongoose.models.Period || mongoose.model("Period", PeriodSchema  );