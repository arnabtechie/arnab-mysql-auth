const express = require('express');
const { check } = require('express-validator');
const auth = require('../controllers/auth.js');

const router = express.Router();

// ------------------------------Unauthenticated---------------------------//
router.post(
  '/users/signup',
  [
    check('full_name', 'Please enter name.').not().isEmpty(),
    check('email', 'Please enter valid email').isEmail(),
    check('password', 'Please enter valid password').isLength({ min: 4 }),
  ],
  auth.signup,
);
router.post(
  '/users/login',
  [
    check('email', 'Please enter valid email').isEmail(),
    check('password', 'Please enter valid password').isLength({ min: 4 }),
  ],
  auth.login,
);

// ----------------------------------------------------------------------//

router.use(auth.protect);

// ------------------------------Authenticated---------------------------//
router.get('/users/logout', auth.logout);

// ---------------------------------------------------------------------//

module.exports = router;
