const express = require('express');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  applicationBodySchema,
  createApplication,
  getApplications,
} = require('../controllers/applicationController');

const router = express.Router();

router.use(authenticate);
router.post('/', validate(applicationBodySchema), createApplication);
router.get('/', getApplications);

module.exports = router;
