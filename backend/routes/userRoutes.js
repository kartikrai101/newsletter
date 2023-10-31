const express = require('express');
const router = express.Router();
const {register, verifyEmail, login, updateProfile, authenticateUser, getUser, authenticateAdmin, getAllPosts, refreshToken, createPost, getPost, updatePost, deletePost, likePost, likes, createComment, getComments, updateComment, deleteComment, savePost} = require('../controllers/userController');

router.route('/register').post(register)
router.route('/verify').get(verifyEmail)
router.route('/login').post(login)
router.route('/token').post(refreshToken)
router.route('/:id').get(authenticateUser, getUser)
router.route('/:id').put(authenticateUser, updateProfile)

// posts routes
router.route('/posts').get(authenticateUser, getAllPosts)
router.route('/post/create').post(authenticateAdmin, createPost)
router.route('/post/:id').get(authenticateUser, getPost)
router.route('/post/:id').put(authenticateAdmin, updatePost)
router.route('/post/:id').delete(authenticateAdmin, deletePost)
router.route('/post/:id/save').get(authenticateUser, savePost)

// likes routes
router.route('/post/:id/like').post(authenticateUser, likePost)
router.route('/post/:id/likes').get(authenticateUser, likes)

// comments routes
router.route('/post/:id/comment').post(authenticateUser, createComment)
router.route('/post/:id/comments').get(authenticateUser, getComments)
router.route('/comment/:commentId').put(authenticateUser, updateComment)
router.route('/comment/:commentId').delete(authenticateUser, deleteComment)
//router.route('/post/:id/comment/:commentId').put(authenticateUser, updateComment)

module.exports = router;