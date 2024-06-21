const express = require('express');
const router = express.Router();
const axios = require('axios');
const middlewares = require('../middlewares');
const navigation = require('../navigation');

// router.use goal is for manage user access to route
router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});

/**
 * @swagger
 * /statistics:
 *   get:
 *     tags:
 *      - statistics route
 *     summary: Get the statistics page
 *     responses:
 *       200:
 *         description: Request successfully executed.
 */
router.get('/', async function (req, res, next) {
    res.locals.navigation = navigation.Get(req, navigation.routes.statistics);

    res.render('./backOffice/statistics/statistics')
});

module.exports = router;
