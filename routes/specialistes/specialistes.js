const express = require('express');
const router = express.Router();
const axios = require('axios');

/**
 * @swagger
 * /specialistes:
 *   get:
 *     tags:
 *      - specialistes route
 *     summary: Get the specialistes page
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/', async function (req, res, next) {
    let specialistes = await axios.get('http://localhost:3000/api/specialistes');

    res.locals.specialistes = specialistes.data;

    console.log(res.locals.specialistes);
    res.render('./specialistes/specialistes')
});

/**
 * @swagger
 * /specialistes:
 *   get:
 *     tags:
 *      - specialistes route
 *     summary: Get the filtered specialistes page
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/filter', async function (req, res, next) {
    try {
        let specialistes = await axios.get(`http://localhost:3000/api/specialistes/filter?specialite=${req.query.specialite}`);

        res.locals.specialistes = specialistes.data;

        res.render('./specialistes/specialistes')
    } catch(e) {
        console.error(e);
    }
});

module.exports = router;