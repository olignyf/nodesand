var mongoose = require('mongoose');

// create a schema
var userSchema = new mongoose.Schema({
  id: mongoose.Schema.ObjectId,
  name: String,
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  admin: Boolean,
  Logo: String,
  LogoFullRes: String,
  Banner: String,
  BannerFullRes: String,
  meta: {
    age: Number,
    website: String
  },
  ip_at_creation: String,
  ip_location_at_creation: String,
  current_location: String,
  created_at: Date,
  updated_at: Date
});
var User = mongoose.model('User', userSchema);
