const express = require('express');
const router = express.Router();
const axios = require('axios');
const navigation = require('../../navigation');
const middlewares = require('../../middlewares');
const utils = require('../../utils');

router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 1, res, next);
});

/**
 * @swagger
 * /back_office/admin:
 *   get:
 *     tags:
 *       - admin route
 *     summary: Get the backoffice's admin page
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/', async function (req, res, next) {
    try {
        // request the currently used Gmail address the service is connected on OAuth2
        const gmailOauth2 = await axios.get(`${process.env.SERVER_ADDRESS}/api/oauth2/email/google`, {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});

        if (gmailOauth2.err) {
            res.sendStatus(500);
            return;
        }

        res.locals.data = {
            gmailOauth2Email: gmailOauth2.data,
            baseUrl: process.env.SERVER_ADDRESS,
            gmailClientID: process.env.GMAIL_CLIENT_ID
        };
        res.locals.navigation = navigation.Get(req, navigation.routes.backOffice.sub.admin);
        res.render('./backOffice/admin/admin')
    } catch (e) {
        res.sendStatus(500);
    }
});

module.exports = router;
