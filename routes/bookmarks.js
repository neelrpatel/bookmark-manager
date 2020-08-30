const express = require('express');
const validator = require('validator');
const Bookmark = require('../models/bookmark');
const { ensureAuthenticated } = require('../middleware/auth');
const { ensureValidObjectId } = require('../middleware/db-objects');
const { checkBookmarkingItemQuery, renderErrorPage } = require('../utils/errors');
const { renderBookmarkFormPage } = require('../utils/bookmark-forms');

const router = express.Router();

// GET /bookmarks
// Redirect to /bookmarks/add
router.get('/', ensureAuthenticated, (req, res) => {
  res.redirect('/bookmarks/add');
});

// GET /bookmarks/add
// Show 'New Bookmark' page
router.get('/add', ensureAuthenticated, async (req, res) => {
  renderBookmarkFormPage(res, req.user.id, new Bookmark(), 'Add');
});

// POST /bookmarks
// Create bookmark
router.post('/', ensureAuthenticated, async (req, res) => {
  const { name, url, folder, isPinned } = req.body;
  const userId = req.user.id;

  const bookmark = new Bookmark({
    name: name.trim(),
    url,
    isPinned: !!isPinned,
    folder: folder || null,
    user: userId
  });

  if (!validator.isURL(url)) {
    renderBookmarkFormPage(
      res,
      userId,
      bookmark,
      'Add',
      'Sorry, the URL you provided is invalid. Please provide a valid URL for your bookmark.',
      400
    );
    return;
  }

  try {
    await bookmark.save();
    res.redirect('/');
  } catch (error) {
    console.error(error);
    renderBookmarkFormPage(
      res,
      userId,
      bookmark,
      'Add',
      'Sorry, we were unable to create your bookmark. Please try again.',
      500
    );
  }
});

// GET /bookmarks/:id
// Redirect to /bookmarks/:id/edit (using object ID provided in request params)
router.get('/:id', ensureAuthenticated, ensureValidObjectId, (req, res) => {
  res.redirect(`/bookmarks/${req.params.id}/edit`);
});

// GET /bookmarks/:id/edit
// Show 'Edit Bookmark' page
router.get('/:id/edit', ensureAuthenticated, ensureValidObjectId, async (req, res) => {
  try {
    const bookmark = await Bookmark.findById(req.params.id).lean({ virtuals: true });

    const queryErrorStatus = checkBookmarkingItemQuery(bookmark, req.user.id);
    if (queryErrorStatus) {
      renderErrorPage(res, queryErrorStatus);
      return;
    }

    renderBookmarkFormPage(res, req.user.id, bookmark, 'Edit');
  } catch (error) {
    console.error(error);
    renderErrorPage(res, 500);
  }
});

// PUT /bookmarks/:id
// Update bookmark
router.put('/:id', ensureAuthenticated, ensureValidObjectId, async (req, res) => {
  let bookmark;
  const userId = req.user.id;
  try {
    bookmark = await Bookmark.findById(req.params.id);

    const queryErrorStatus = checkBookmarkingItemQuery(bookmark, req.user.id);
    if (queryErrorStatus) {
      renderErrorPage(res, queryErrorStatus);
      return;
    }

    const { name, url, folder, isPinned } = req.body;

    bookmark.name = name.trim();
    bookmark.url = url;
    bookmark.isPinned = !!isPinned;
    bookmark.folder = folder || null;

    if (!validator.isURL(url)) {
      renderBookmarkFormPage(
        res,
        userId,
        bookmark,
        'Edit',
        'Sorry, the URL you provided is invalid. Please provide a valid URL for your bookmark.',
        400
      );
      return;
    }

    await bookmark.save();

    res.redirect('/');
  } catch (error) {
    console.error(error);
    renderBookmarkFormPage(
      res,
      userId,
      bookmark,
      'Edit',
      'Sorry, we were unable to update your bookmark. Please try again.',
      500
    );
  }
});

// DELETE /bookmarks/:id
// Delete bookmark
router.delete('/:id', ensureAuthenticated, ensureValidObjectId, async (req, res) => {
  try {
    const bookmark = await Bookmark.findById(req.params.id);

    const queryErrorStatus = checkBookmarkingItemQuery(bookmark, req.user.id);
    if (queryErrorStatus) {
      renderErrorPage(res, queryErrorStatus);
      return;
    }

    await bookmark.remove();

    res.redirect('back');
  } catch (error) {
    console.error(error);
    renderErrorPage(res, 500);
  }
});

module.exports = router;
