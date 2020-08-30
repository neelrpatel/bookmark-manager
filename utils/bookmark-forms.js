const Folder = require('../models/folder');
const { renderErrorPage } = require('./errors');

module.exports = {
  // Render add/edit bookmark form page and display error message if there is one
  renderBookmarkFormPage: async (
    res,
    userId,
    bookmark,
    operation,
    errorMessage = null,
    status = 200
  ) => {
    try {
      const folders = await Folder.find({ user: userId })
        .collation({ locale: 'en' })
        .sort({ name: 1 })
        .lean({ virtuals: true });

      const locals = {
        operation,
        bookmark,
        folders,
        errorMessage,
        title: `${operation} Bookmark - Bookmark Manager`
      };
      res.status(status).render(`bookmarks/${operation}`, locals);
    } catch (error) {
      console.error(error);
      renderErrorPage(res, 500);
    }
  }
};
