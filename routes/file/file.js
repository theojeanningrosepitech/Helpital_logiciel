const express = require('express');
const router = express.Router();
const axios = require('axios');
const utils = require('../utils');
const fs = require('fs');
const crypto = require('crypto');
const utilsServer = require('../../server/utils');
const middlewares = require('../middlewares');
const FILES_PATH = './server/files/encrypted';

/*
router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});
*/

/**
 * @swagger
 * /file:
 *   get:
 *     tags:
 *       - file route
 *     summary: Get a file
 *     parameters:
 *      - in: query
 *        name: uuid
 *        schema:
 *          type: string
 *        description: identifier of the file
 *        example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       400:
 *         description: Bad request.
 *       401:
 *         description: Invalid credentials.
 *       403:
 *         description: Ressource cannot be accessed.
 *       404:
 *         description: Ressource not found.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/', async function(req, res, next) {
    /*const userID = await utilsServer.GetUserIdFromSession(req);

    if (userID === -1) {
        res.status(401).send('No session could be found.');
        return;
    }*/

    if ( !req.query.uuid || req.query.uuid == '') {
        res.sendStatus(400);
        return;
    }
    const filePath = FILES_PATH + '/' + req.query.uuid;

    try {
        // check if file exists in database
        const file = await axios.get(`${process.env.SERVER_ADDRESS}/api/files/information?uuid=${req.query.uuid}`, {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});

        if (file.err) {
            res.status(500).send(file.err);
            return;
        }
        /*if (file.data.patient_id != 0 && file.data.user_id != userID && file.data.shared_users.split(',').indexOf(userID) === -1) {
            res.status(403).send('You cannot access this ressource.');
            return;
        }*/
        const fileStat = utilsServer.FileStat(filePath);

        if ( !fileStat) {
            res.status(404).send('Missing file.');
            return;
        }

        const readStream = fs.createReadStream(filePath);
        //const iv = Buffer.alloc(16, 0);
        //const decipher = crypto.createDecipheriv('aes-256-ctr', process.env.SECURE_KEY, iv);
        const decipher = crypto.createDecipher('aes-256-ctr', process.env.SECURE_KEY);

        res.writeHead(200, {
            'Content-Type': file.data.mime_type,
            'Content-Disposition': `attachment; filename="${file.data.filename}"`,
            'Server': 'Helpital',
            'Keep-Alive': 'timeout=3, max=100',
            'Pragma': 'no-cache',
            'Cache-control': 'no-store',
            'X-Filename': `${file.data.filename}`,
            'Content-Length': fileStat.size
        });

        readStream.pipe(decipher).pipe(res);
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
});

module.exports = router;
