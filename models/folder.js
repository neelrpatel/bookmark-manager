const mongoose = require('../config/database');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');

const folderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 100
    },
    isPinned: {
      type: Boolean,
      required: true,
      default: false
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

folderSchema.virtual('id').get(function () {
  return this._id.toString();
});

folderSchema.plugin(mongooseLeanVirtuals);

module.exports = mongoose.model('Folder', folderSchema);
