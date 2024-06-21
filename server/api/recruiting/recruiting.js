var express = require('express');
var router = express.Router();
const db = require('../../database');
const utils = require('../../utils');
const axios = require("axios");

/**
 * @swagger
 * /api/recruiting:
 *   get:
 *     tags:
 *      - recruiting api
 *     summary: Get a list of job offers
 *     responses:
 *       200:
 *         description: A JSON array containing a list of job offers.
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
    const response = await db.Select(`select * from recruiting`);

    if (response.err)
        res.status(500).send(response.err);
    res.send(response);
});

/**
 * @swagger
 * /api/recruiting:
 *   post:
 *     tags:
 *      - recruiting api
 *     summary: Add an offer to the job offers list
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type_emploiement:
 *                 type: string
 *                 example: Interne
 *               remuneration:
 *                 type: int
 *                 example: 1000
 *               skills:
 *                 type: string
 *                 example: 7 ans médecine, 4 ans en hôpital
 *               start_date:
 *                 type: string
 *                 example: 02/09/2022
 *     responses:
 *       200:
 *         description: Offer successfully added
 *         content:
 *           plain/text:
 *             example: Data inserted
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.post('/', async function (req, res, next) {
    const result = await utils.PostController(req, res, 'recruiting');
});
module.exports = router;
