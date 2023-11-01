const express = require('express');
const { authenticateUser } = require('../controllers/userController');
const app = express();
const router = express.Router();
const {searchUser} = require('../controllers/searchControllers')

router.route('/user').post(authenticateUser, searchUser)

module.exports = router;