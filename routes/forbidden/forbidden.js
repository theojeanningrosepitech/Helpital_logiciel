const express = require('express');
const router = express.Router();
const axios = require('axios');
const middlewares = require('../middlewares');

// router.use goal is for manage user access to route
router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});

/**
 * @swagger
 * /forbidden:
 *   get:
 *     tags:
 *      - forbidden route
 *     summary: Get the forbidden page
 *     responses:
 *       200:
 *         description: Request successfully executed.
 */

router.get('/', async function (req, res, next) {
    console.log({cookies: req.cookies});
    res.render('./forbidden/forbidden')
});

module.exports = router;
