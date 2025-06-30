const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const RouteSchema = new Schema(
{
    departure :{type: Schema.Types.ObjectId, ref:"Address", required: true},
    arrival :{type: Schema.Types.ObjectId, ref:"Address", required: true},
    distanceTravelled :{type: Number, required: true, min:0}

});

RouteSchema.virtual("url").get(function () {
    return `/route${this._id}`;
  });

module.exports = mongoose.models.Route || mongoose.model("Route", RouteSchema  );