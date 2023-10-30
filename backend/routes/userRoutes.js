const express = require('express');
const router = express.Router();
const {register, verifyEmail, login, authenticateUser, authenticateAdmin, getAllPosts, refreshToken, createPost} = require('../controllers/userController');

router.route('/register').post(register)
router.route('/verify').get(verifyEmail)
router.route('/login').post(login)
router.route('/token').post(refreshToken)

// posts routes
router.route('/allPosts').get(authenticateUser, getAllPosts)
router.route('/createPost').post(authenticateAdmin, createPost)

module.exports = router;