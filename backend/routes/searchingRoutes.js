const express = require('express');
const { authenticateUser } = require('../controllers/userController');
const app = express();
const router = express.Router();
const {searchUser, searchPost} = require('../controllers/searchControllers')

router.route('/user').post(authenticateUser, searchUser)
router.route('/post').post(authenticateUser, searchPost)

module.exports = router;