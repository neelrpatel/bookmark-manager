const mongoose = require('../config/database');
const { renderErrorPage } = require('../utils/errors');

module.exports = {
  ensureValidObjectId: (req, res, next) => {
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next();
    }
    renderErrorPage(res, 404);
  }
};
