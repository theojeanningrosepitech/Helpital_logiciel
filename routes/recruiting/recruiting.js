const express = require('express');
const router = express.Router();
const axios = require('axios');
const middlewares = require('../middlewares');

router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 3, res, next);
});

/**
 * @swagger
 * /recruiting:
 *   get:
 *     tags:
 *      - recruiting route
 *     summary: Get the recruiting page
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/', async function (req, res, next) {
    let offers = await axios.get('http://localhost:3000/api/recruiting');

    res.locals.offers = offers.data;

    console.log(res.locals.offers);
    res.render('./recruiting/recruiting')
});

module.exports = router;