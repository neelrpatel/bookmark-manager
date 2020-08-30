const express = require('express');
const passport = require('passport');

const router = express.Router();

// GET /auth/google
// Authenticate with Google (step 1) - send user to Google sign-in page
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile']
  })
);

// GET /auth/google/callback
// Authenticate with Google (step 2) - callback to verify authentication
router.get(
  '/google/callback',
  passport.authenticate('google', {
    successRedirect: '/',
    failureRedirect: '/login'
  })
);

// GET /auth/logout
// Log out user
router.get('/logout', (req, res) => {
  req.logOut();
  res.redirect('/login');
});

module.exports = router;
