const express = require('express');
const router = express.Router();
const axios = require('axios');
const middlewares = require('../middlewares');
const utils = require('../utils');
const navigation = require('../navigation');

// router.use goal is for manage user access to route
router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});

/**
 * @swagger
 * /profil:
 *   get:
 *     tags:
 *      - profil route
 *     summary: Get the profil page
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/', async function (req, res, next) {
    try {
        let userProfileID = req.cookies.userId;

        if (req.query.user_profil)
            userProfileID = req.query.user_profil;
        const user = await axios.get(`${process.env.SERVER_ADDRESS}/api/users?id=${userProfileID}`, {header:{cookies:req.cookies}});
        const avatars = await axios.get(`${process.env.SERVER_ADDRESS}/api/avatars`, {header:{cookies:req.cookies}});
        const roles = await axios.get(`${process.env.SERVER_ADDRESS}/api/roles`, {header:{cookies:req.cookies}});
        const services = await axios.get(`${process.env.SERVER_ADDRESS}/api/services`, {header:{cookies:req.cookies}});
        const totp = await axios.get(`${process.env.SERVER_ADDRESS}/api/auth/totp`, {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});
        const contacts = await axios.get(`${process.env.SERVER_ADDRESS}/api/contacts`, {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});
        const banner = await axios.get(`${process.env.SERVER_ADDRESS}/api/banner`, {header:{cookies:req.cookies}});

        let qrcode2fa;

        if (user.err || avatars.err || roles.err || services.err || totp.err || banner.err) {
            res.sendStatus(500);
            return;
        }

        try {
            const qrcode2faResp = await axios.get(`${process.env.SERVER_ADDRESS}/api/auth/2fa/qrcode`, {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});
            qrcode2fa = qrcode2faResp.data;
        } catch (e) {
            qrcode2fa = '';
        }

        console.log(user.data[0]);
        res.locals.data = {
            user: user.data[0],
            avatars: avatars.data,
            roles: roles.data,
            services: services.data,
            totpEnabled: totp.data,
            qrcode2fa: qrcode2fa,
            contacts: contacts.data,
            banner: banner.data,
        };
        res.locals.navigation = navigation.Get(req, navigation.routes.profil);
        res.render('./profil/profil')
    } catch (e) {
        res.sendStatus(500);
    }
});

module.exports = router;
