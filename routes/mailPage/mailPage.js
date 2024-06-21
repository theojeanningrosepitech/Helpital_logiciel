const express = require('express');
const router = express.Router();
const axios = require('axios');

/**
 * @swagger
 * /mailPage:
 *   get:
 *     tags:
 *      - mailPage route
 *     summary: Get the mailPag page
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/', async function (req, res, next) {
    res.render('./mailPage/mailPage')
});

module.exports = router;