const express = require('express');
const router = express.Router();
const axios = require('axios');
const middlewares = require('../middlewares');

// router.use goal is for manage user access to route
router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});

router.get('/', async function (req, res, next) {

    let vehicle = await axios.get(`http://localhost:3000/api/vehicle?user_id=${req.cookies.userId}`);

    res.locals.data = vehicle.data;
    res.render('./emergency/vehicle')
});

module.exports = router;