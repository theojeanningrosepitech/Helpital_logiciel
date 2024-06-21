const express = require('express');
const router = express.Router();
const axios = require('axios');

/**
 * @swagger
 * /recruitingAdd:
 *   get:
 *     tags:
 *      - recruitingAdd route
 *     summary: Get the creation of job offers page
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/', async function (req, res, next) {
    res.render('./recruiting/recruitingAdd')
});

module.exports = router;