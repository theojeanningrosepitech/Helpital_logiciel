const express = require('express');
const router = express.Router();
const axios = require('axios');
const navigation = require('../navigation');
const middlewares = require('../middlewares');
const utils = require('../utils');

// router.use goal is for manage user access to route
router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});

/**
 * @swagger
 * /plan:
 *   get:
 *     tags:
 *       - plan route
 *     summary: Get the plan page
 *     responses:
 *       200:
 *         description: Request successfully executed.
 */
router.get('/', async function (req, res, next) {
    const response = await axios.get(`${process.env.SERVER_ADDRESS}/api/backoffice/user?id=${req.cookies.userId}`, {header:{cookies:req.cookies}});
    const preferences = await axios.get(`${process.env.SERVER_ADDRESS}/api/preferences`, {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});
    let patients = await axios.get(`${process.env.SERVER_ADDRESS}/api/patients`);

    res.locals.data = patients.data;
    res.locals.favorites = response.data.favorite;
    res.locals.sections = response.data.section;
    res.locals.preferences = preferences.data;
    res.locals.navigation = navigation.Get(req, navigation.routes.plan);

    res.render('./plan/plan')
});

module.exports = router;
