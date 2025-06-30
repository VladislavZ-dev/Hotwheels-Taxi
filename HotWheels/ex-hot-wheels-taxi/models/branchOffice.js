const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const BranchOfficeSchema = new Schema(
{
    nipc: { type: Number, required: true, min:100000000, max:999999999, unique: true},
    name: {type: String, required: true, unique: true},
    phoneNumber: { type: Number, required: true, min:100000000, max:999999999, unique: true},
    address: {type: Schema.Types.ObjectId, ref: "Address" },
    
});

BranchOfficeSchema.virtual("url").get(function () {

    return `/branchOffice${this._id}`;
  });
   
module.exports = mongoose.models.BranchOffice || mongoose.model("BranchOffice", BranchOfficeSchema);