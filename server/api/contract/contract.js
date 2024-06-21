var express = require('express');
var router = express.Router();
const db = require('../../database');
const axios = require('axios');
const middlewares = require('../../utils');

// router.use goal is for manage user access to route
// router.use('/', async function (req, res, next) {
//     await middlewares.RoleMiddleware(req.cookies.userId, res, next);
// });

/**
 * @swagger
 * /api/contract:
 *   get:
 *     tags:
 *      - contract api
 *     summary: Get a list of all contract
 *     responses:
 *       200:
 *         description: A JSON array containing a list of all user contract.
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
    const response = await db.Select(`SELECT * FROM contract`);

    if (response.err) {
        res.sendStatus(500).send(response.err);
        return;
    }
    res.send(response.data);
});

/**
 * @swagger
 * /api/contract:
 *   post:
 *     tags:
 *      - contract api
 *     summary: Add a contract to a user in the contract list
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *                 example: 2
 *               title:
 *                  type: string
 *                  example: CDI
 *     responses:
 *       200:
 *         description: A JSON array containing information about the new contract.
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
router.post('/', async function (req, res, next) {
    const start_at = new Date();
    const insertData = {
        user_id: req.body.user_id,
        title: req.body.title,
        start_at: middlewares.FormatSqlDate(start_at)
    };
    const result = await db.InsertData('contract', insertData);

    if (result.err) {
        res.status(500).json({error: result.err})
        return
    }
});

/**
 * @swagger
 * /api/contract/closeAt:
 *   put:
 *     tags:
 *      - contract api
 *     summary: Change the contract in finish contract
 *     parameters:
 *      - in: query
 *        id: id
 *        schema:
 *          type: integer
 *        description: ID of the contract
 *        example: 2
 *     responses:
 *       200:
 *         description: Contract successfully modified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *                   example: Event updated
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.put('/closeAt', async function(req, res) {
    const id = req.query.id;
    const send_at = new Date();
    const result = await db.UpdateData('contract', id, { close_at: middlewares.FormatSqlDate(send_at) });

    if (result.err) {
        res.status(500).json({ error: result.err });
        return;
    }
    res.status(200).json({ response: 'Event updated' });
})

module.exports = router;
