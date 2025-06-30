const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const PriceSchema = new Schema(
{
    basic: {type: Number, required: true, min: 0},
    luxurious: {type: Number, required: true, min: 0},
    nightFee: {type: Number, required: true, min: 0}
});

PriceSchema.virtual("url").get(function () {

    return `/prices${this._id}`;
  });
  
module.exports = mongoose.models.Prices || mongoose.model("Prices", PriceSchema);