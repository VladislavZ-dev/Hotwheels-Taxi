const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const AddressSchema = new Schema(
{
    _id: { type: Schema.Types.ObjectId, auto: true },
    street: {type: String, required: true},
    doorNumber: {type: Number, required: true},
    postCode: {type: String, required: true},
    locality: {type: String, required: true},
});

AddressSchema.virtual("url").get(function () {

    return `/address${this._id}`;
  });
  
  
  module.exports = mongoose.models.Address ||mongoose.model("Address", AddressSchema );