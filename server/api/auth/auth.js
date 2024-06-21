var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const axios = require('axios');
const uuid = require('uuid');
const crypto = require('crypto');
const middlewares = require('../../utils');
const utils = require('../../utils');
const db = require('../../database');
const mails = require('../../mails');
const totp = require('2fa-util');
const qrcode = require('qrcode');
let sms;

if (process.env.TWO_FACTOR_AUTH === 'enabled' && process.env.TWILIO_ACCOUNT_SID !== '' && process.env.TWILIO_AUTH_TOKEN !== '') {
    sms = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - auth api
 *     summary: Log a user.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               login:
 *                 type: string
 *                 example: arthur.petit
 *               password:
 *                 type: string
 *                 example: password
 *               device_type:
 *                 type: integer
 *                 example: 0
 *     responses:
 *       200:
 *         description: A JSON object containing either information about the newly created session, or information about a newly created 2FA session.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   example: 2FA / simple
 *                 sessionID:
 *                   type: string
 *                   example: oEiZk4uR5kfjf394sk
 *                 userId:
 *                   type: integer
 *                   example: 14
 *                 token:
 *                   type: string
 *                   example: RaNdOmToKeN1234
 *                 prefered_sending_method:
 *                   type: string
 *                   example: email / sms / totp
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.post('/login', async function (req, res, next) {
    // const machineId = req.body.machineId;
    const deviceType = parseInt(req.body.device_type);

    if (deviceType !== 0 && deviceType !== 1) {
        res.status(400).send('Missing \'device_type\' field');
        return;
    }
    const salt = req.body.password + process.env.SECURE_KEY;
    const hash = crypto.createHash('sha256').update(salt).digest('hex');

    let response = await db.Select(`SELECT id, prefered_2fa_method, totp_secret, nfc_code from users WHERE login = '${req.body.login}' AND password = '${hash}'`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length === 0) {
        res.status(401).send('Bad credentials');
        return;
    }
    const userID = response.data[0].id;
    let preferedSendingMethod = response.data[0].prefered_2fa_method; // email, sms or totp

    if (response.data[0].totp_secret !== null && response.data[0].totp_secret !== '')
        preferedSendingMethod = 'totp';
    else if (preferedSendingMethod === 'totp' && (response.data[0].totp_secret === null || response.data[0].totp_secret === ''))
        preferedSendingMethod = 'email';

    if (process.env.TWO_FACTOR_AUTH === 'enabled' /*&& process.env.WHITELIST_IP.split(',').indexOf(req.ip) === -1*/) {
        // create 2FA session
        const code = crypto.randomBytes(3).toString('hex').toUpperCase();
        const token = crypto.randomBytes(16).toString('hex').toUpperCase();
        const timeLimit = 5 * 60 * 1000; // 5 minutes
        const expiresAt = new Date((new Date()).getTime() + timeLimit);

        console.log('Code 2FA: ' + code);

        const insertData = {
            token: token,
            code: code,
            device_type: deviceType,
            user_id: userID,
            created_at: utils.FormatSqlDate(new Date()),
            expires_at: utils.FormatSqlDate(expiresAt)
        };
        response = await db.InsertData('two_factor_authentication', insertData);

        if (response.err) {
            res.status(500).send(response.err);
            return;
        }
        res.status(200).send({
            type: '2FA',
            token: token,
            prefered_sending_method: preferedSendingMethod
        });
    } else {
        // create login session
        const timeLimit = 24 * 3600 * 1000; // 24 hours
        const expiresAt = new Date((new Date()).getTime() + timeLimit);
        const sessionUUID = uuid.v4();
        const insertData = {
            uuid: sessionUUID,
            user_id: userID,
            device_type: deviceType,
            created_at: utils.FormatSqlDate(new Date()),
            expires_at: utils.FormatSqlDate(expiresAt)
        };
        response = await db.InsertData('sessions', insertData);

        if (response.err) {
            res.status(500).send(response.err);
            return;
        }
        res.cookie('sessionID', sessionUUID);
        res.cookie('userId', userID);
        res.cookie('samesite', 'none');
        res.cookie('secure', 'true');
        res.status(200).send({
            type: 'simple',
            sessionID: sessionUUID,
            userId: userID
        });
    }
});

/**
 * @swagger
 * /api/auth/2fa/send:
 *   get:
 *     tags:
 *       - auth api
 *     summary: Sends a 2FA token to a user via email or SMS.
 *     parameters:
 *      - in: query
 *        name: Cookie token-2FA
 *        schema:
 *          type: string
 *        description: current 2FA session token
 *        example: FdKLj3RGiD67F4kOF4
 *      - in: query
 *        name: method
 *        schema:
 *          type: string
 *        description: Sending method
 *        example: email / sms / totp / nfc
 *     responses:
 *       200:
 *         description: A JSON object containing either information about the receiver, or information about a TOTP session (for unit tests only).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 receiver:
 *                   type: string
 *                   example: arthur.petit@helpital.fr / 0622441166
 *                 code:
 *                   type: string
 *                   example: Totp12
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Send method not allowed with the current configuration.
 *       403:
 *         description: Invalid phone number.
 *       500:
 *         description: Internal server error
 */
router.get('/2fa/send', async function (req, res, next) {
    const sendingMethod = req.query.method;  // email, sms or totp
    const token2FA = req.cookies['token-2FA'];

    if (typeof token2FA === 'undefined' || !token2FA) {
        res.status(400).send('Missing \'token-2FA\' cookie');
        return;
    }
    // retreive 2FA session code
    let response = await db.Select(`SELECT user_id, code, expires_at from two_factor_authentication WHERE token = '${token2FA}' AND expires_at > CURRENT_TIMESTAMP`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    } else if (response.data.length === 0) {
        res.status(400).send('Bad token');
        return;
    }
    const userID = response.data[0].user_id;
    const code = response.data[0].code;
    const expiresAt = new Date(response.data[0].expires_at);
    let receiver = '';

    // send code
    switch (sendingMethod) {
        case 'email':
            response = await db.Select(`SELECT email from users WHERE id = ${userID}`);

            if (response.err) {
                res.status(500).send(response.err);
                return;
            } else if (response.data.length === 0) {
                res.status(400).send('Bad user_id');
                return;
            }
            receiver = response.data[0].email;
            const message = `Bonjour,\r\n\r\nVoici le code qui vous permettra de vous authentifier sur notre service: ${code}\r\n\r\nAttention, ce code arrivera à expiration le ${expiresAt.toLocaleDateString()} à ${expiresAt.toLocaleTimeString()}.`;
            mails.Send([receiver], 'Code d\'authentification', message);
            break;
        case 'sms':
            if (process.env.TWILIO_ACCOUNT_SID === '' || process.env.TWILIO_AUTH_TOKEN === '') {
                res.status(400).send('SMS session not set.');
                return;
            }
            response = await db.Select(`SELECT phone from users WHERE id = ${userID}`);

            if (response.err) {
                res.status(500).send(response.err);
                return;
            } else if (response.data.length === 0) {
                res.status(400).send('Bad user_id');
                return;
            }
            receiver = response.data[0].phone;
            let phoneNumber = receiver.replaceAll('.', '').replaceAll(' ', '');

            if (phoneNumber.length !== 0 && phoneNumber.charAt(0) === '0')
                phoneNumber = '+33' + phoneNumber.substr(1);
            if (phoneNumber.length !== 12) {
                res.status(403).send('Invalid phone number');
                return;
            }
            sms.messages.create({body: `Helpital - Voici votre code de double authentification: ${code}`, from: process.env.TWILIO_PHONE_NUMBER, to: phoneNumber});
            break;
        case 'totp': // nothing to send
        case 'test': // only for unit tests
            if (process.env.NODE_ENV !== 'test') {
                res.status(401).send('Send method not allowed with the current configuration.');
                return;
            }
            res.status(200).send({
                code: code,
            });
            return;
        default:
            console.error('Invalid sending method');
            res.status(500).send('Invalid sendingMethod');
            return;
    }
    res.status(200).send({
        receiver: receiver,
    });
});



/**
 * @swagger
 * /api/auth/2fa/qrcode:
 *   get:
 *     tags:
 *       - auth api
 *     summary: Get the QR code related to the last 2FA session of the connected user.
 *     responses:
 *       200:
 *         description: Qr code encoded as URI
 *         content:
 *           plain/text:
 *             example: fhgu3ejskqvnzifvfi5aozfsv8nqkzenfnioe33Fzin2zicnoeiznfze95caoiefn...
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.get('/2fa/qrcode', async function (req, res, next) {
    const userID = await utils.GetUserIdFromSession(req);

    if (userID === -1) {
        res.status(401).send('No session could be found.');
        return;
    }
    const response = await db.Select(`SELECT code, token FROM two_factor_authentication WHERE user_id = '${userID}' AND expires_at > CURRENT_TIMESTAMP ORDER BY id DESC LIMIT 1`);

    if (response.err) {
        console.log(userID);
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length === 0) {
        res.status(401).send('No 2FA session could be found');
        return;
    }

    try {
        const code = await qrcode.toDataURL(response.data[0].code);
        res.status(200).send(code);
    } catch (e) {
            console.log(e);
        res.status(500).json({ error: e });
    }
});


/**
* @swagger
* /api/auth/2fa/login:
*   post:
*     tags:
*       - auth api
*     summary: Log a user by using 2FA.
*     parameters:
*      - in: query
*        name: Cookie token-2FA
*        schema:
*          type: string
*        description: 2FA login session token
*        example: FdKLj3RGiD67F4kOF4
*     requestBody:
*       content:
*         application/json:
*           schema:
*             type: object
*             properties:
*               code:
*                 type: string
*                 example: 2FAcOdE
*               method:
*                 type: string
*                 example: email
*     responses:
*       200:
*         description: A JSON object containing information about the newly created session.
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 sessionID:
*                   type: string
*                   example: oEiZk4uR5kfjf394sk
*                 userId:
*                   type: integer
*                   example: 14
*         headers:
*           Set-Cookie:
*             schema:
*               type: string
*               example: token-2FA=; sessionID=randomSessionID; userId=1; samesite=none; secure=true
*       400:
*         description: Bad parameters
*       401:
*         description: Bad credentials
*       500:
*         description: Internal server error
*/
router.post('/2fa/login', async function (req, res, next) {
    const token = req.cookies['token-2FA'];
    const code = req.body.code;
    const method = req.body.method; // email, sms, totp

    if (typeof token === 'undefined' || !token) {
        res.status(400).send('missing \'token\'');
        return;
    } else if (typeof code === 'undefined' || !code) {
        res.status(400).send('missing \'code\'');
        return;
    }
    let response = await db.Select(`SELECT id, code, user_id, device_type FROM two_factor_authentication WHERE token = '${token}' AND expires_at > CURRENT_TIMESTAMP`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length === 0) {
        res.status(401).send('Bad credentials');
        return;
    }
    const twoFactorID = response.data[0].id;
    const userID = response.data[0].user_id;
    const deviceType = response.data[0].device_type;

    switch (method) {
        case 'test':
            if (process.env.NODE_ENV !== 'test') {
                res.status(401).send('Send method not allowed with current configuration.');
                return;
            }
        case 'sms':
        case 'email':
            if (code !== response.data[0].code) {
                res.status(401).send('Bad credentials');
                return;
            }
            break;
        case 'totp':
            response = await db.Select(`SELECT totp_secret FROM users WHERE id = '${userID}'`);

            if (response.err) {
                res.status(500).send(response.err);
                return;
            }

            if (response.data.length === 0) {
                res.status(500).send('Could not retreive user');
                return;
            }
            const check = await totp.verify(code, response.data[0].totp_secret);

            if ( !check) {
                res.status(401).send('Bad credentials');
                return;
            }
            break;
        case 'nfc':
            response = await db.Select(`SELECT nfc_code FROM users WHERE id = '${userID}'`);

            if (response.err) {
                res.status(500).send(response.err);
                return;
            }

            if (response.data.length === 0) {
                res.status(500).send('Could not retreive user');
                return;
            }

            if (code !== response.data[0].nfc_code) {
                res.status(401).send('Bad credentials');
                return;
            }
            break;
        case 'qrcode':
            // check data from qrcode for mobile 2FA
            const hash = crypto.createHash('sha256').update(token + response.data[0].code).digest('hex');

            if (hash !== response.data[0].code) {
                res.status(401).send('Bad credentials');
                return;
            }
            break;
        default:
            console.error('Invalid login method');
            res.status(400).send('Invalid login method');
            return;
    }
    response = await db.DeleteData('two_factor_authentication', twoFactorID);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }
    // create login session
    const timeLimit = 24 * 3600 * 1000; // 24 hours
    const expiresAt = new Date((new Date()).getTime() + timeLimit);
    const sessionUUID = uuid.v4();
    const insertData = {
        uuid: sessionUUID,
        user_id: userID,
        device_type: deviceType,
        created_at: utils.FormatSqlDate(new Date()),
        expires_at: utils.FormatSqlDate(expiresAt)
    };
    response = await db.InsertData('sessions', insertData);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }
    res.cookie('token-2FA', '');
    res.cookie('sessionID', sessionUUID);
    res.cookie('userId', userID);
    res.cookie('samesite', 'none');
    res.cookie('secure', 'true');
    res.status(200).send({
        sessionID: sessionUUID,
        userId: userID
    });
});

/**
* @swagger
* /api/auth/logout:
*   get:
*     tags:
*       - auth api
*     summary: Logout a user.
*     parameters:
*      - in: query
*        name: Cookie sessionID
*        schema:
*          type: string
*        description: session ID
*        example: BdKLj3RGiD67F4kOF4
*     responses:
*       200:
*         description: Successfully logged out.
*         content:
*           plain/text:
*             example: Logged out successfully.
*         headers:
*           Set-Cookie:
*             schema:
*               type: string
*               example: sessionID=; userId=; samesite=none; secure=true
*       400:
*         description: Bad parameters
*       401:
*         description: Bad credentials
*       500:
*         description: Internal server error
*/
router.get('/logout', async function (req, res, next) {

    if (typeof req.cookies.sessionID === 'undefined' || !req.cookies.sessionID) {
        res.status(400).send('missing \'sessionID\' cookie');
        return;
    }
    let response = await db.Select(`SELECT id from sessions WHERE uuid = '${req.cookies.sessionID}'`);

    if (response.err) {
        console.error(response.err);
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length === 0) {
        res.send('data not found');
        res.status(200).send('Data not found');
        return;
    }
    response = await db.DeleteData('sessions', response.data[0].id);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    res.cookie('sessionID', '');
    res.cookie('userId', '');
    res.cookie('samesite', 'none');
    res.cookie('secure', 'true');
    res.status(200).send('Logged out successfully.');
});

/**
 * @swagger
 * /api/auth/user_id:
 *   get:
 *     tags:
 *       - auth api
 *     summary: Get the ID of the connected user.
 *     parameters:
 *      - in: query
 *        name: Cookie sessionID
 *        schema:
 *          type: string
 *        description: session ID
 *        example: BdKLj3RGiD67F4kOF4
 *     responses:
 *       200:
 *         description: user ID
 *         content:
 *           plain/text:
 *             example: 1
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.get('/user_id', async function (req, res, next) {
    const userID = await utils.GetUserIdFromSession(req);

    if (userID === -1) {
        res.status(401).send('No session could be found.');
        return;
    }
    res.status(200).send({userID: userID});
});

/**
 * @swagger
 * /api/auth/user:
 *   get:
 *     tags:
 *       - auth api
 *     summary: Get the user information of the connected user.
 *     parameters:
 *      - in: query
 *        name: Cookie sessionID
 *        schema:
 *          type: string
 *        description: session ID
 *        example: BdKLj3RGiD67F4kOF4
 *     responses:
 *       200:
 *         description: user informations
 *         content:
 *           application/json:
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.get('/user', async function (req, res, next) {
    const userID = await utils.GetUserIdFromSession(req);

    if (userID === -1) {
        res.status(401).send('No session could be found.');
        return;
    }
    const response = await db.Select(`SELECT * FROM users where id = ${userID}`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length === 0) {
        res.status(401).send('No user could be found.');
        return;
    }
    res.status(200).send(response.data[0]);
});

/**
 * @swagger
 * /api/auth/totp:
 *   get:
 *     tags:
 *       - auth api
 *     summary: Check if TOTP is enabled for the current user.
 *     parameters:
 *      - in: query
 *        name: Cookie sessionID
 *        schema:
 *          type: string
 *        description: session ID
 *        example: BdKLj3RGiD67F4kOF4
 *     responses:
 *       200:
 *         description: Return true or false.
 *         content:
 *           plain/text:
 *             example: true
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.get('/totp', async function (req, res, next) {
    const userID = await utils.GetUserIdFromSession(req);

    if (userID === -1) {
        res.status(401).send('No session could be found.');
        return;
    }
    const response = await db.Select(`SELECT totp_secret FROM users where id = ${userID}`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length === 0) {
        res.status(401).send('No user could be found.');
        return;
    }
    res.status(200).send(response.data[0].totp_secret !== null && response.data[0].totp_secret !== '');
});

/**
 * @swagger
 * /api/auth/totp-2fa:
 *   get:
 *     tags:
 *       - auth api
 *     summary: Check if TOTP is enabled for the user of the current 2FA session.
 *     parameters:
 *      - in: query
 *        name: Cookie token-2FA
 *        schema:
 *          type: string
 *        description: 2FA login session token
 *        example: FdKLj3RGiD67F4kOF4
 *     responses:
 *       200:
 *         description: Return true or false.
 *         content:
 *           plain/text:
 *             example: true
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.get('/totp-2fa', async function (req, res, next) {
    const token = req.cookies['token-2FA'];

    if (typeof token === 'undefined' || !token) {
        res.status(400).send('missing \'token-2FA\'');
        return;
    }
    let response = await db.Select(`SELECT user_id FROM two_factor_authentication WHERE token = '${token}' AND expires_at > CURRENT_TIMESTAMP`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length === 0) {
        res.status(401).send('2FA session could not be found');
        return;
    }
    response = await db.Select(`SELECT totp_secret FROM users where id = ${response.data[0].user_id}`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length === 0) {
        res.status(401).send('No user could be found.');
        return;
    }
    res.status(200).send(response.data[0].totp_secret !== null && response.data[0].totp_secret !== '');
});

/**
 * @swagger
 * /api/auth/totp:
 *   post:
 *     tags:
 *       - auth api
 *     summary: Enable TOTP for the current user.
 *     parameters:
 *      - in: query
 *        name: Cookie sessionID
 *        schema:
 *          type: string
 *        description: session ID
 *        example: BdKLj3RGiD67F4kOF4
 *     responses:
 *       200:
 *         description: Information on the newly created TOTP access (+ QR Code).
 *         content:
 *           application/json:
 *           schema:
 *             type: object
 *             properties:
 *               secret:
 *                 type: string
 *                 example: kfuI4EIGJ6jodEng3ZID
 *               qrcode:
 *                 type: string
 *                 example: base64encodedQrCode
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.post('/totp', async function (req, res, next) {

    const userID = await utils.GetUserIdFromSession(req);

    if (userID === -1) {
        res.status(401).send('No session could be found.');
        return;
    }
    const response = await db.Select('SELECT login FROM users WHERE id = \'' + userID + '\'');

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length === 0) {
        res.status(401).send('No user could be found.');
        return;
    }
    const result = await totp.generateSecret(response.data[0].login, 'Helpital');
    const wait = await db.UpdateData('users', userID, { totp_secret: result.secret });

    if (wait.err) {
        res.status(500).json({ error: wait.err });
        return;
    }
    res.status(200).send(result);
});

/**
 * @swagger
 * /api/auth/totp:
 *   delete:
 *     tags:
 *       - auth api
 *     summary: Disable TOTP for the current user.
 *     parameters:
 *      - in: query
 *        name: Cookie sessionID
 *        schema:
 *          type: string
 *        description: session ID
 *        example: BdKLj3RGiD67F4kOF4
 *     responses:
 *       201:
 *         description: TOTP successfully disabled.
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.delete('/totp', async function (req, res, next) {
    const userID = await utils.GetUserIdFromSession(req);

    if (userID === -1) {
        res.status(401).send('No session could be found.');
        return;
    }
    const wait = await db.UpdateData('users', userID, { totp_secret: '' });

    if (wait.err) {
        res.status(500).json({ error: wait.err });
        return;
    }
    res.status(201).end();
});

/**
 * @swagger
 * /api/auth/last-connection:
 *   post:
 *     tags:
 *       - auth api
 *     summary: Get the last connection datetime for the current user.
 *     parameters:
 *      - in: query
 *        name: Cookie sessionID
 *        schema:
 *          type: string
 *        description: session ID
 *        example: BdKLj3RGiD67F4kOF4
 *     responses:
 *       200:
 *         description: SQL formated date
 *         content:
 *           plain/text:
 *             example: 2022-02-02 14:00:00
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.get('/last-connection', async function (req, res, next) {

    if (!req.cookies || typeof req.cookies.sessionID === 'undefined' || !req.cookies.sessionID) {
        // missing \'sessionID\' cookie'
        res.status(403).json({ error: 'cookies sessionID not found' });
    }
    const response = await db.Select('SELECT created_at FROM sessions WHERE uuid = \'' + req.cookies.sessionID + '\' ORDER BY id DESC LIMIT 1');

    if (response.err) {
        console.error(response.err);
        res.status(500).json({ error: wait.err });
    }

    if (!response.data || response.data.length === 0) {
        // No session could be found.
        res.status(500).json({ error: 'session not found' });
    }

    res.send(response.data[0].created_at);
});

module.exports = router;
