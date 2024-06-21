var express = require('express');
var router = express.Router();
const db = require('../../database');
const axios = require('axios');
const middlewares = require('../../middlewares');
const utils = require('../../utils');
const websocket = require("../../websocket");

/**
 * @swagger
 * /api/insult:
 *   get:
 *     tags:
 *      - insult api
 *     summary: Get a list of all insult
 *     responses:
 *       200:
 *         description: A JSON array containing a list of all insult and her filter.
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
    const response = await db.Select(`SELECT * FROM insult`);

    if (response.err) {
        res.sendStatus(500).send(response.err);
        return;
    }
    res.send(response.data);
});

/**
 * @swagger
 * /api/insult:
 *   post:
 *     tags:
 *      - insult api
 *     summary: Add an insult for all user in list insult
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *                 example: 2
 *               name:
 *                  type: string
 *                  example: Pute
 *               name_filter:
 *                  type: string
 *                  example: §§§§
 *     responses:
 *       200:
 *         description: A JSON array containing information about the new insult.
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
    const name = req.body.name;
    const name_filter = req.body.name_filter;
    const insertData = {
        name: name,
        name_filter: name_filter,
    };

    const result = await db.InsertData('insult', insertData);
    if (result.err) {
        res.status(500).json({error: result.err})
        return
    }
    res.status(200).json({message: 'insult add', id: result.data});
});

/**
 * @swagger
 * /api/insult:
 *   delete:
 *     tags:
 *      - insult api
 *     summary: Delete an insult for all user in list insult
 *     responses:
 *       200:
 *         description: A JSON array containing information about the new insult.
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
router.delete('/', async function(req, res) {
    const result = await utils.DeleteController(req, res, 'insult');
});

module.exports = router;