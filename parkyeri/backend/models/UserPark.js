const mongoose = require('mongoose');

const userParkSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  location: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('UserPark', userParkSchema); 