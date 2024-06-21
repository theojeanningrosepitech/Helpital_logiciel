const express = require('express');
const router = express.Router();
const axios = require('axios');
const middlewares = require('../middlewares');

// router.use goal is for manage user access to route
router.use('/', async function (req, res, next) {
  await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});

router.get('/', async function (req, res, next) {

  let meeting = await axios.get(`http://localhost:3000/api/meeting?user_id=${req.cookies.userId}`);

  res.locals.data = meeting.data;
  res.render('./planning/meeting')
});

module.exports = router;