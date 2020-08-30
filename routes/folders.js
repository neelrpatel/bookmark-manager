const express = require('express');
const Folder = require('../models/folder');
const Bookmark = require('../models/bookmark');
const { ensureAuthenticated } = require('../middleware/auth');
const { ensureValidObjectId } = require('../middleware/db-objects');
const { checkBookmarkingItemQuery, renderErrorPage } = require('../utils/errors');

const router = express.Router();

// GET /folders
// Redirect to /folders/add
router.get('/', ensureAuthenticated, (req, res) => {
  res.redirect('/folders/add');
});

// GET /folders/add
// Show 'New Folder' page
router.get('/add', ensureAuthenticated, (req, res) => {
  res.render('folders/add', {
    folder: new Folder(),
    title: 'Add Folder - Bookmark Manager'
  });
});

// POST /folders
// Create folder
router.post('/', ensureAuthenticated, async (req, res) => {
  const folder = new Folder({
    name: req.body.name.trim(),
    isPinned: !!req.body.isPinned,
    user: req.user.id
  });

  try {
    await folder.save();
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).render('folders/add', {
      folder,
      title: 'Add Folder - Bookmark Manager',
      errorMessage: 'Sorry, we were unable to create your folder. Please try again.'
    });
  }
});

// GET /folders/:id
// Show folder and the bookmarks it holds (or bookmarks as specified by search options)
router.get('/:id', ensureAuthenticated, ensureValidObjectId, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id).lean({ virtuals: true });

    const queryErrorStatus = checkBookmarkingItemQuery(folder, req.user.id);
    if (queryErrorStatus) {
      renderErrorPage(res, queryErrorStatus);
      return;
    }

    let query = Bookmark.find({ folder: folder.id });

    if (req.query.expression) {
      query = query.regex('name', new RegExp(req.query.expression.trim(), 'i'));
    }
    if (req.query.updatedAfter) {
      query = query.gte('updatedAt', req.query.updatedAfter);
    }
    if (req.query.updatedBefore) {
      query = query.lte('updatedAt', req.query.updatedBefore);
    }

    const bookmarks = await query
      .collation({ locale: 'en' })
      .sort({ name: 1 })
      .lean({ virtuals: true })
      .exec();

    res.render('folders/show', {
      folder,
      bookmarks,
      searchOptions: req.query,
      title: `${folder.name} - Bookmark Manager`
    });
  } catch (error) {
    console.error(error);
    renderErrorPage(res, 500);
  }
});

// GET /folders/:id/edit
// Show 'Edit Folder' page
router.get('/:id/edit', ensureAuthenticated, ensureValidObjectId, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id).lean({ virtuals: true });

    const queryErrorStatus = checkBookmarkingItemQuery(folder, req.user.id);
    if (queryErrorStatus) {
      renderErrorPage(res, queryErrorStatus);
      return;
    }

    res.render('folders/edit', {
      folder,
      title: 'Edit Folder - Bookmark Manager'
    });
  } catch (error) {
    console.error(error);
    renderErrorPage(res, 500);
  }
});

// PUT /folders/:id
// Update folder
router.put('/:id', ensureAuthenticated, ensureValidObjectId, async (req, res) => {
  let folder;
  try {
    folder = await Folder.findById(req.params.id);

    const queryErrorStatus = checkBookmarkingItemQuery(folder, req.user.id);
    if (queryErrorStatus) {
      renderErrorPage(res, queryErrorStatus);
      return;
    }

    folder.name = req.body.name.trim();
    folder.isPinned = !!req.body.isPinned;

    await folder.save();

    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).render('folders/edit', {
      folder,
      title: 'Edit Folder - Bookmark Manager',
      errorMessage: 'Sorry, we were unable to update your folder. Please try again.'
    });
  }
});

// DELETE /folders/:id
// Delete folder and the bookmarks it holds
router.delete('/:id', ensureAuthenticated, ensureValidObjectId, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);

    const queryErrorStatus = checkBookmarkingItemQuery(folder, req.user.id);
    if (queryErrorStatus) {
      renderErrorPage(res, queryErrorStatus);
      return;
    }

    await Promise.all([Bookmark.deleteMany({ folder: folder.id }), folder.remove()]);

    if (req.body.isFolderOpen) {
      res.redirect('/');
    } else {
      res.redirect('back');
    }
  } catch (error) {
    console.error(error);
    renderErrorPage(res, 500);
  }
});

module.exports = router;
