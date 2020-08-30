const mongoose = require('../config/database');

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: true
    },
    displayName: {
      type: String,
      required: true
    },
    firstName: {
      type: String,
      required: true
    },
    picture: {
      type: String,
      required: true
    }
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false
    }
  }
);

module.exports = mongoose.model('User', userSchema);
