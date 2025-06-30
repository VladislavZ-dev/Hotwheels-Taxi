const mongoose = require("mongoose");
const branchOffice = require("./branchOffice");
const Schema = mongoose.Schema;
const ReceiptSchema = new Schema(
{
    number: { type: Number, required: true, unique: true, min:1},
    date: {type: Date, required: true},
    branchOffice: {type: Schema.Types.ObjectId, ref:"BranchOffice", required: true},
    client: {type: Schema.Types.ObjectId, ref: "Client", required: true},
    price: {type: Number, min:0},
    trip: {type: Schema.Types.ObjectId, ref: "Trip", required: true}
});

ReceiptSchema.virtual("url").get(function () {

    return `/receipt${this._id}`;
  });
  
  
  module.exports = mongoose.models.Receipt ||mongoose.model("Receipt", ReceiptSchema );