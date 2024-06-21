const express = require('express');
const router = express.Router();
const axios = require('axios');
const navigation = require('../../navigation');

/**
 * @swagger
 * /insult:
 *   get:
 *     tags:
 *      - insult route
 *     summary: Get details of db insult and add or delete insult
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/', async function (req, res, next) {
    try {
        const insult = await axios.get(`${process.env.SERVER_ADDRESS}/api/insult`, {header:{cookies:req.cookies}});

        if (insult.err) {
            res.sendStatus(500);
            return;
        }
        res.locals.data = {
            insult: insult.data,
        };
        res.locals.navigation = navigation.Get(req, navigation.routes.backOffice.sub.insult);
        res.render('./backOffice/insult/insult')
    } catch (e) {
        res.sendStatus(500);
    }
});

module.exports = router;