const express = require('express');
const app = express();
const router = express.Router();
const {registerUser} = require('../controllers/employeeControllers');

router.route('/register').post(registerUser);

module.exports = router;