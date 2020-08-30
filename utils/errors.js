module.exports = {
  checkBookmarkingItemQuery: (bookmarkingItem, userId) => {
    if (!bookmarkingItem) {
      return 404;
    } else if (bookmarkingItem.user.toString() !== userId) {
      return 403;
    }

    return 0;
  },
  renderErrorPage: (res, status) => {
    let title;
    let message;

    if (status === 404) {
      title = 'Page Not Found';
      message = 'Sorry, the page you were looking for could not be found.';
    } else if (status === 403) {
      title = 'Access Forbidden';
      message = 'Sorry, you do not have permission to access this page or functionality.';
    } else {
      title = 'Unexpected Error';
      message = 'Sorry, an error occurred while trying to handle your request.';
    }

    res.status(status).render('errors/page', { status, title, message });
  }
};
