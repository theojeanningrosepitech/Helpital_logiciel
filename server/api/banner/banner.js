var express = require('express');
var router = express.Router();
const db = require('../../database');
const axios = require('axios');
const middlewares = require('../../middlewares');

/*router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});*/

/**
 * @swagger
 * /api/avatars:
 *   get:
 *     tags:
 *      - avatars api
 *     summary: Get a list of all banner
 *     responses:
 *       200:
 *         description: A JSON array containing a list of all banner.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.get('/', async function (req, res, next) {
    const response = await db.Select(`SELECT * FROM banner`);

    if (response.err) {
        res.sendStatus(500).send(response.err);
        return;
    }
    res.send(response.data);
});

module.exports = router;