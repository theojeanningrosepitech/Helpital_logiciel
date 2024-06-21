const express = require('express');
const router = express.Router();
const axios = require('axios');
const middlewares = require('../middlewares');
const navigation = require('../navigation');

router.use('/', async function (req, res, next) {
  await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});

router.get('/', async function (req, res, next) {
    res.locals.navigation = navigation.Get(req, navigation.routes.emergency);
    res.render('./emergency/emergency')
});

module.exports = router;
