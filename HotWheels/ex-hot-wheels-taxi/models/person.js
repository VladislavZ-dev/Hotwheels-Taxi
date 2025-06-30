const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const PersonSchema = new Schema(
{
    nif: { type: Number, required: true, min:100000000, max:999999999, unique: true},
    gender: {type: String, enum: ["Male","Female"]},
    name: {type: String, required: true},
});

PersonSchema.virtual("url").get(function () {
    return `/person${this._id}`;
  });

module.exports = mongoose.models.Person || mongoose.model("Person", PersonSchema);