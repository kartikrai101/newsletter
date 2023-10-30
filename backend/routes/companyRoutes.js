const express = require('express')
const router = express.Router();
const {companyRegister, loginHandler, refreshTokenHandler} = require('../controllers/companyController');
const {verifyMail, getCompanies, authenticateToken} = require('../controllers/companyController')

router.route('/register').post(companyRegister)
router.route('/verify').get(verifyMail)
router.route('/login').post(loginHandler)
router.route('/token').post(refreshTokenHandler)
router.route('/companies').get(authenticateToken, getCompanies)

module.exports = router;