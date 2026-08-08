const mongoose = require("mongoose");

const designSchema = new mongoose.Schema({
  designNo: {
    type: String,
    required: true,
    unique: true
  },

  // 📷 Design ki photo — sirf LINK yahan rehta hai, photo khud cloud pe.
  // Photo DB me daalne se DB bhaari ho jaata hai aur har query dheemi.
  imageUrl: { type: String, trim: true, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("Design", designSchema);