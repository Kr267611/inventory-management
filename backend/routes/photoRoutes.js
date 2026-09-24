const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

/* Design ki photo Cloudinary pe jaati hai. Photo seedha browser se Cloudinary
   jaati hai — backend sirf ek "signature" (permission) deta hai. Isse:
     • API secret kabhi browser tak nahi pahunchta
     • Cloudinary me "upload preset" banane ki zaroorat nahi
     • badi photo Render ke server se hoke nahi guzarti

   backend/.env (aur Render) me chahiye — ya to ye ek line:
     CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
   ya ye teen:
     CLOUDINARY_CLOUD_NAME=...
     CLOUDINARY_API_KEY=...
     CLOUDINARY_API_SECRET=...                                            */

function cloudinaryConfig() {
  const url = process.env.CLOUDINARY_URL || "";
  const m = url.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
  if (m) return { apiKey: m[1], apiSecret: m[2], cloud: m[3] };

  return {
    cloud: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  };
}

router.get("/sign", (req, res) => {
  const { cloud, apiKey, apiSecret } = cloudinaryConfig();
  if (!cloud || !apiKey || !apiSecret) {
    return res.status(503).json({ message: "Photo upload abhi setup nahi hai." });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = "designs";
  // Cloudinary ka niyam: params A-Z me, "&" se jode, aakhir me secret, phir SHA-1
  const signature = crypto
    .createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  res.json({ cloud, apiKey, timestamp, folder, signature });
});

module.exports = router;
