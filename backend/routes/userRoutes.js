const express = require('express');
const router = express.Router();
const {register, verifyEmail, login, authenticateUser, authenticateAdmin, getAllPosts, refreshToken, createPost, getPost, updatePost, deletePost, likePost, dislikePost} = require('../controllers/userController');

router.route('/register').post(register)
router.route('/verify').get(verifyEmail)
router.route('/login').post(login)
router.route('/token').post(refreshToken)

// posts routes
router.route('/posts').get(authenticateUser, getAllPosts)
router.route('/post/create').post(authenticateAdmin, createPost)
router.route('/post/:id').get(authenticateUser, getPost)
router.route('/post/:id').put(authenticateAdmin, updatePost)
router.route('/post/:id').delete(authenticateAdmin, deletePost)

// likes routes
router.route('/post/:id/like').post(authenticateUser, likePost)
// router.route('/post/:id/unlike').post(authenticateUser, dislikePost)

module.exports = router;