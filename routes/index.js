const express = require('express');
const Folder = require('../models/folder');
const Bookmark = require('../models/bookmark');
const { ensureAuthenticated, redirectAuthenticated } = require('../middleware/auth');
const { renderErrorPage } = require('../utils/errors');

const router = express.Router();

// GET /
// Show pinned items and (up to) 12 most recently updated items
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;

    const [
      pinnedItems,
      pinnedFolders,
      recentlyUpdatedItems,
      recentlyUpdatedFolders
    ] = await Promise.all([
      Bookmark.find({ isPinned: true, user: userId }).lean({ virtuals: true }),
      Folder.find({ isPinned: true, user: userId }).lean({ virtuals: true }),
      Bookmark.find({ user: userId }).sort({ updatedAt: -1 }).limit(12).lean({ virtuals: true }),
      Folder.find({ user: userId }).sort({ updatedAt: -1 }).limit(12).lean({ virtuals: true })
    ]);

    pinnedItems.push(...pinnedFolders);
    pinnedItems.sort((lhs, rhs) => lhs.name.localeCompare(rhs.name, 'en', { sensitivity: 'base' }));

    recentlyUpdatedItems.push(...recentlyUpdatedFolders);
    recentlyUpdatedItems.sort((lhs, rhs) => rhs.updatedAt - lhs.updatedAt);
    if (recentlyUpdatedItems.length > 12) {
      recentlyUpdatedItems.splice(12);
    }

    res.render('index', {
      recentlyUpdatedItems,
      pinnedItems,
      title: 'Bookmark Manager'
    });
  } catch (error) {
    console.error(error);
    renderErrorPage(res, 500);
  }
});

// GET /login
// Show login page
router.get('/login', redirectAuthenticated, (req, res) => {
  res.render('login', { layout: false });
});

// GET /search
// Show search page along with any search results found
router.get('/search', ensureAuthenticated, async (req, res) => {
  if (
    req.query.expression === undefined &&
    req.query.updatedAfter === undefined &&
    req.query.updatedBefore === undefined
  ) {
    res.render('search', {
      searchResults: [],
      searchOptions: req.query,
      title: 'Search - Bookmark Manager'
    });
    return;
  }

  try {
    const userId = req.user.id;

    let bookmarkQuery = Bookmark.find({ user: userId });
    let folderQuery = Folder.find({ user: userId });

    if (req.query.expression) {
      bookmarkQuery = bookmarkQuery.regex('name', new RegExp(req.query.expression.trim(), 'i'));
      folderQuery = folderQuery.regex('name', new RegExp(req.query.expression.trim(), 'i'));
    }
    if (req.query.updatedAfter) {
      bookmarkQuery = bookmarkQuery.gte('updatedAt', req.query.updatedAfter);
      folderQuery = folderQuery.gte('updatedAt', req.query.updatedAfter);
    }
    if (req.query.updatedBefore) {
      bookmarkQuery = bookmarkQuery.lte('updatedAt', req.query.updatedBefore);
      folderQuery = folderQuery.lte('updatedAt', req.query.updatedBefore);
    }

    const [searchResults, folderResults] = await Promise.all([
      bookmarkQuery.lean({ virtuals: true }).exec(),
      folderQuery.lean({ virtuals: true }).exec()
    ]);

    searchResults.push(...folderResults);
    searchResults.sort((lhs, rhs) => lhs.name.localeCompare(rhs.name, 'en', { sensitivity: 'base' }));

    res.render('search', {
      searchResults,
      searchOptions: req.query,
      title: 'Search - Bookmark Manager'
    });
  } catch (error) {
    console.error(error);
    renderErrorPage(res, 500);
  }
});

module.exports = router;
