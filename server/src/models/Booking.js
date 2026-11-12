const mongoose = require("mongoose");
const crypto = require("crypto");

const bookingSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      unique: true,
      required: true,
      default: function () {
        return "FF-" + Date.now().toString().slice(-6) + crypto.randomBytes(2).toString("hex").toUpperCase();
      }
    },
    customerName: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    service: { type: String, required: true, enum: ["ac", "plumbing", "electrical", "appliance"] },
    problem: { type: String, required: true, trim: true, maxlength: 1500 },
    address: { type: String, required: true, trim: true, maxlength: 300 },
    preferredDate: { type: Date, required: true },
    preferredTime: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["Pending", "Assigned", "In Progress", "Completed", "Cancelled"],
      default: "Pending"
    },
    technician: { type: mongoose.Schema.Types.ObjectId, ref: "Technician", default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
