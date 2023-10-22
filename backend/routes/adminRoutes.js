const express = require('express');
const router = express.Router();
const {registerAdmin} = require('../controllers/adminControllers');

router.route('/register').post(registerAdmin)

module.exports = router;