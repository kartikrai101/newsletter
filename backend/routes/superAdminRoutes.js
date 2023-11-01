const express = require('express');
const router = express.Router();
const {createAdmin, createUser} = require('../controllers/superAdminControllers');
const { authenticateSuperAdmin } = require('../controllers/superAdminControllers');

router.route('/make-admin/:id').get(authenticateSuperAdmin, createAdmin)
router.route('/make-user/:id').get(authenticateSuperAdmin, createUser)

module.exports = router;