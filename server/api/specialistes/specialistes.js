var express = require('express');
var router = express.Router();
const db = require('../../database');
const utils = require('../../utils');
const axios = require("axios");

/**
 * @swagger
 * /api/specialistes:
 *   get:
 *     tags:
 *      - specialistes api
 *     summary: Get a list of specialistes
 *     responses:
 *       200:
 *         description: A JSON array containing a list of specialistes.
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
    const response = await db.Select(`select * from specialistes`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }
    res.send(response);
});

/**
 * @swagger
 * /api/specialistes:
 *   get:
 *     tags:
 *      - specialistes api
 *     summary: Get a list of filtered specialistes
 *     parameters:
 *      - in: query
 *        name: specialite
 *        schema:
 *          type: string
 *        description: specialite for filter
 *        example: Ophtalmologue
 *     responses:
 *       200:
 *         description: A JSON array containing a list of filtered specialistes.
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
router.get('/filter', async function (req, res, next) {
    const response = await db.Select(`select * from specialistes WHERE specialite = '${req.query.specialite}'`);
    console.log(`select * from specialistes WHERE specialite = '${req.query.specialite}'`);

    if (response.err) {
        res.status(500).send(response.err);
        console.error(response.err);
        return;
    }
    res.send(response);
});

/**
 * @swagger
 * /api/specialists:
 *   delete:
 *     tags:
 *      - specialistes api
 *     summary: Remove a specialist from the current specialists list
 *     responses:
 *       200:
 *         description: Event successfully modified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *                   example: Row deleted
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.delete('/', async function(req, res) {
    return utils.DeleteRow(req, res, 'specialistes');
});

module.exports = router;
