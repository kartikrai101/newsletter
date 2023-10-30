const express = require('express');
const router = express.Router();
const {register, verifyEmail, login, authenticateUser, authenticateAdmin, getAllPosts, refreshToken, createPost, getPost} = require('../controllers/userController');

router.route('/register').post(register)
router.route('/verify').get(verifyEmail)
router.route('/login').post(login)
router.route('/token').post(refreshToken)

// posts routes
router.route('/posts').get(authenticateUser, getAllPosts)
router.route('/post/create').post(authenticateAdmin, createPost)
router.route('/post/:id').get(authenticateUser, getPost)

module.exports = router;