const express = require('express');
const app = express();
const router = express.Router();
const {registerEmployee} = require('../controllers/employeeControllers');

router.route('/register').post(registerEmployee);

module.exports = router;