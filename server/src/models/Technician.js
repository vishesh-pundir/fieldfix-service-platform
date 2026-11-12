const mongoose = require("mongoose");

const technicianSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, maxlength: 160 },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    skills: {
      type: [{ type: String, enum: ["ac", "plumbing", "electrical", "appliance"] }],
      validate: {
        validator: function (skills) {
          return skills.length > 0;
        },
        message: "Add at least one service skill."
      }
    },
    available: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Technician", technicianSchema);
