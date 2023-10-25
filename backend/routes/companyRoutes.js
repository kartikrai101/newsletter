const express = require('express')
const router = express.Router();
const {companyRegister} = require('../controllers/companyController');
const {verifyMail} = require('../controllers/companyController')

router.route('/register').post(companyRegister)
router.route('/verify').get(verifyMail)

module.exports = router;