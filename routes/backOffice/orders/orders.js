const express = require('express');
const router = express.Router();
const middlewares = require('../../middlewares');
const axios = require('axios');

router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 1, res, next);
});

router.get('/', async function (req, res, next) {
    const orders = await axios.get(`${process.env.SERVER_ADDRESS}/api/orders`, {header:{cookies:req.cookies}});

    if (orders.err) {
        res.sendStatus(500);
        return;
    }

    res.locals.data = {
        orders: orders.data
    };
    res.render('./backOffice/orders/orders');
});

module.exports = router;
