const mongoose = require('../config/database');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');

const bookmarkSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 100
    },
    url: {
      type: String,
      required: true
    },
    isPinned: {
      type: Boolean,
      required: true,
      default: false
    },
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: 'Folder'
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

bookmarkSchema.virtual('id').get(function () {
  return this._id.toString();
});

bookmarkSchema.plugin(mongooseLeanVirtuals);

module.exports = mongoose.model('Bookmark', bookmarkSchema);
