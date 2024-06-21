var express = require('express');
var router = express.Router();
const db = require('../../database');
const axios = require("axios");
const middlewares = require('../../middlewares');

/*router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});*/

/**
 * @swagger
 * /api/roles:
 *    get:
 *     summary: Get a list of roles
 *     parameters:
 *      - in: query
 *        id: id
 *        schema:
 *          type: integer
 *        description: ID of the user_role
 *        example: 2
 *     responses:
 *       200:
 *         description: A JSON array containing a list of role.
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
    let query = 'select * from software_role';

    if (req.query.id)
        query += ' WHERE id = ' + req.query.id;
    const response = await db.Select(query);

    if (response.err) {
        res.sendStatus(500).send(response.err);
        return
    } else
        res.send(response.data);
});

module.exports = router;
