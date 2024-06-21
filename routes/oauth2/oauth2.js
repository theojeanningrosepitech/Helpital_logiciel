const express = require('express');
const router = express.Router();
const axios = require('axios');
const middlewares = require('../middlewares');
const utils = require('../utils');

// router.use goal is for manage user access to route
/*router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 4, res, next);
});*/

/**
 * @swagger
 * /oauth2/{service}:
 *   get:
 *     tags:
 *       - oauth2 route
 *     summary: Redirection endpoint to handle code from an OAuth2 new access
 *     parameters:
 *      - in: query
 *        name: code
 *        schema:
 *          type: string
 *        description: OAuth2 endpoint code
 *        example: FdKLj3RGiD67F4kOF4
 *      - in: path
 *        name: service
 *        schema:
 *          type: string
 *        description: OAuth2 service
 *        example: google
 *     responses:
 *       502:
 *         description: Redirect to a page that close automaticaly
 *       500:
 *         description: Internal serveur error.
 */
router.get('/:service', async function (req, res, next) {
    const service = req.params.service;
    const code = req.query.code;

    if (!service || service === '' || !code || code === '') {
        res.sendStatus(404);
        return;
    }
    // Get token from oauth2 code
    let uri = "https://accounts.google.com/o/oauth2/token";
    const body = `code=${encodeURI(code)}&client_id=${encodeURI(process.env.GMAIL_CLIENT_ID)}&client_secret=${encodeURI(process.env.GMAIL_SECRET)}&redirect_uri=${process.env.SERVER_ADDRESS}/oauth2/google&grant_type=authorization_code`;
    const oauth2sessionID = 1;

    try {
        let response = await axios.post(uri, body, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            }
        });

        if (response.data.access_token === '' || response.data.refresh_token === '' || response.data.expires_in < 1) {
            res.sendStatus(500);
            return;
        }
        const accessToken = response.data.access_token;
        const expiresIn = response.data.expires_in;
        const refreshToken = response.data.refresh_token;

        // Check authentication (get email adress)
        uri = "https://openidconnect.googleapis.com/v1/userinfo"

        response = await axios.get(uri, {
            headers: {
                Authorization: 'Bearer ' + accessToken,
            }
        });

        if (response.data.email === '') {
            res.sendStatus(500);
            return;
        }

        const wait = await axios.put(`${process.env.SERVER_ADDRESS}/api/oauth2?id=${oauth2sessionID}`, {
            email: response.data.email,
            bearer: Buffer.from(accessToken).toString('base64'),
            refresh_token: Buffer.from(refreshToken).toString('base64'),
            expiration: utils.FormatSqlDate(new Date((new Date()).getTime() + expiresIn * 1000))
        });
        res.redirect('/close-window');
    } catch (e) {
        console.error(e);
        res.sendStatus(500);
    }
});

module.exports = router;
