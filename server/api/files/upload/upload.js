const express = require('express');
const router = express.Router();
const utils = require("../../../utils");
const db = require("../../../database");
const crypto = require('crypto');
const uuid = require('uuid');
const fs = require('fs');
const UPLOAD_SESSION_LIFETIME = 3600000; // 1 hour in ms
const UPLOAD_MAX_FILE_SIZE = 10000000000; // 10Gb
const UPLOAD_PATH = './server/files/encrypted';
let uploadSessions = {};

/*
router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});*/

/**
 * @swagger
 * /api/files/upload/session:
 *   get:
 *     tags:
 *       - files api
 *     summary: Check if the upload session passed in header is valid (not expired)
 *     parameters:
 *      - in: query
 *        name: x-uuid
 *        schema:
 *          type: string
 *        description: upload session identifier
 *        example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: A string containing the result "expired" OR "valid"
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get('/session', async function(req, res, next) {
    const uuid = req.headers['x-uuid'];

    if ( !uuid || uuid == '' || !uploadSessions[uuid]) {
        res.sendStatus(400);
        return;
    }

    if ((new Date()) - uploadSessions[uuid].date > UPLOAD_SESSION_LIFETIME) {
        res.send('expired');
    } else
        res.send('valid');
});

/**
 * @swagger
 * /api/files/upload/session:
 *   post:
 *     tags:
 *       - files api
 *     summary: Create/prepare an upload session
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               filename:
 *                 type: string
 *                 example: picture.jpeg
 *               folder:
 *                 type: string
 *                 description: folder identifier
 *                 example: 123e4567-e89b-12d3-a456-426614174000 (optional)
 *               replaced_file_uuid:
 *                 type: string
 *                 description: replace a previous file
 *                 example: 123e4567-e89b-12d3-a456-426614174000 (optional)
 *               patient_id:
 *                 type: integer
 *                 example: 2
 *                 description: link the file to a patient
 *     responses:
 *       200:
 *         description: A JSON object containing the new session uuid
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post('/session', async function(req, res, next) {
    const userID = await utils.GetUserIdFromSession(req);

    if (userID === -1) {
        res.status(401).send('No session could be found.');
        return;
    }
    let patientID = 0;
    let sharedUsers = [];

    if ( !req.body.filename || req.body.filename === '') {
        res.status(400).send('Missing filename');
        return;
    }
    const fileExtensionDot = req.body.filename.lastIndexOf('.');
    let fileDisplayName = '';
    let extension = '';
    let folder = null;
    let response;

    if (fileExtensionDot !== -1) {
        fileDisplayName = req.body.filename.substring(0, fileExtensionDot);
        extension = req.body.filename.substring(fileExtensionDot + 1);
    }

    if (req.body.folder) {
        // check if folder exists
        const folderExists = await db.Select(`SELECT id FROM folders WHERE uuid = '${req.body.folder}'`);

        if (folderExists.err) {
            res.status(500).send(folderExists.err);
            return;
        }

        if (folderExists.data.length === 0) {
            res.sendStatus(400);
            return;
        }
        folder = req.body.folder;
    }
    let filenameCount = 0;
    let filenameBase = fileDisplayName;

    // alter filename if several files exists with the same name
    while (1) {
        response = await db.Select(`SELECT id FROM files WHERE display_name = '${fileDisplayName}' AND user_id = ${userID} AND folder ${folder && folder !== '' ? (' = \'' + folder + '\'') : 'IS NULL'}`);

        if (response.err) {
            res.status(500).send(response.err);
            return;
        }

        if (response.data.length === 0) {
            break;
        }
        filenameCount++;
        fileDisplayName = filenameBase + ' (' + filenameCount +')';
    }
    let previousFile;

    // replace an existing file
    if (req.body.replaced_file_uuid) {

        // check if user can replace the file
        response = await db.Select(`SELECT id FROM files WHERE uuid = ${req.body.replaced_file_uuid} AND user_id = ${userID}`);

        if (response.err) {
            res.status(500).send(response.err);
            return;
        }

        if (response.data.length === 0) {
            res.status(400).send('You cannot replace this file.');
            return;
        }
        previousFile = {
            id: response.data[0].id,
            uuid: req.body.replaced_file_uuid,
        };
    }

    if (req.body.patient_id)
        patientID = patient_id;

    const sessionUUID = uuid.v4();

    if ( !sessionUUID || sessionUUID.length != 36) {
        res.sendStatus(500);
        return;
    }
    uploadSessions[sessionUUID] = {
        previousFile: previousFile,
        uuid: sessionUUID,
        date: new Date(),
        user_id: userID,
        folder: folder,
        patient_id: patientID,
        filename: req.body.filename,
        display_name: fileDisplayName,
        extension: extension,
        size: 0,
        mime_type: utils.GetContentType(extension)
    };
    res.send({uuid: sessionUUID});
});

/**
 * @swagger
 * /api/files/upload:
 *   post:
 *     tags:
 *       - files api
 *     summary: Upload a file
 *     description: This route support multi-part upload by using Content-Range Header. Once the file upload is finished, the file will be moved from a temp directory to the main files location. End of upload is automaticaly detected.
 *     parameters:
 *      - in: query
 *        name: x-uuid
 *        schema:
 *          type: string
 *        description: upload session identifier
 *        example: 123e4567-e89b-12d3-a456-426614174000
 *      - in: query
 *        name: content-range
 *        schema:
 *          type: string
 *        description: description of the content (optional)
 *        example: bytes 0-499/500
 *     responses:
 *       200:
 *         description: A JSON object containing the file uuid
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post('/', async function(req, res, next) {
    const uuid = req.headers['x-uuid'];

    if ( !uuid || uuid == '') {
        res.sendStatus(401);
        return;
    }

    if ( !uploadSessions[uuid] || (new Date()) - uploadSessions[uuid].date > UPLOAD_SESSION_LIFETIME) {
        delete uploadSessions[uuid];
        res.sendStatus(401);
        return;
    }
    let chunkEnd, chunkBegin;
    const contentRange = req.headers['content-range']; // bytes 0-499/500

    if (contentRange && contentRange !== '') {
        // res.sendStatus(400).send('Missing Content-Range');
        const chunkEndSep = contentRange.indexOf('-');

        if (chunkEndSep === -1) {
            res.status(400).send('Invalid Content-Range');
            return;
        }
        chunkBegin = parseInt(contentRange.substring(6, chunkEndSep));
        const chunkSizeSep = contentRange.indexOf('/');

        if (typeof chunkBegin !== "number" || chunkSizeSep === -1) {
            res.status(400).send('Invalid Content-Range');
            return;
        }
        chunkEnd = parseInt(contentRange.substring(chunkEndSep + 1, chunkSizeSep));

        if (typeof chunkEnd !== "number") {
            res.status(400).send('Invalid Content-Range');
            return;
        }
        fileSize = parseInt(contentRange.substring(chunkSizeSep + 1));

        if (typeof fileSize !== "number") {
            res.status(400).send('Invalid Content-Range');
            return;
        }
    } else {
        // Content-Range heaer is not present, upload file as it is an entire file.
        fileSize = req.body.length;
        chunkBegin = 0;
        chunkEnd = fileSize - 1;
    }
/*
    try {
        fs.writeFileSync(UPLOAD_PATH + '/fichier.pdf', req.body);
    } catch (err) {
        res.sendStatus(500);
        console.error(err);
        return;
    }
    res.sendStatus(200);
    return;
*/
    // check if body is not empty
    if (chunkBegin === 0 && fileSize < 8) {
        res.status(400).send('Body is empty.');
        return;
    }
    const filename = uuid;
    const filepath = UPLOAD_PATH + '/temp/' + filename;

    // encrypted bytes
//    const iv = Buffer.from('azpeockfoefeeeeeeeeefqsdlkjsqdqs');
//    const cipher = crypto.createCipheriv('aes-256-ctr', process.env.SECURE_KEY, iv);
    const cipher = crypto.createCipher('aes-256-ctr', process.env.SECURE_KEY)
    const bytes = Buffer.concat([cipher.update(req.body), cipher.final()]);

    // first chunk
    if (chunkBegin === 0) {
        if (fileSize > UPLOAD_MAX_FILE_SIZE) {
            res.sendStatus(403);
            utils.DeleteFile(filepath);
            delete uploadSessions[uuid];
            return;
        }

        if (uploadSessions[uuid].mime_type !== 'text/plain' && !utils.CheckMagicNumberUploadCloud(req.body.subarray(0, 8))) {
            res.status(403).send('Bad magic number, this kind of file is not accepeted on this server.');
            utils.DeleteFile(filepath);
            delete uploadSessions[uuid];
            return;
        }

        if (utils.FileExists(filepath)) {
            res.status(403).send('File already exists');
            delete uploadSessions[uuid];
            return;
        }

        try {
            fs.writeFileSync(filepath, bytes);
        } catch (err) {
            res.sendStatus(500);
            console.error(err);
            return;
        }
    } else {
        // append other bytes to an already existing file
        try {
            fs.appendFileSync(filepath, bytes);
        } catch (err) {
            res.sendStatus(500);
            console.error(err);
            return;
        }
    }

    // upload completed
    if (chunkEnd + 1 === fileSize) {
        const result = await finishUpload(uuid);

        if ( !result)
            res.sendStatus(500);
        else
            res.status(201).send({status: 'File created', uuid: uuid}); // StatusCreated
    } else {
        res.status(206).send({status: 'Creation in progress', uuid: uuid}); // StatusPartialContent
    }
});

// move file from temp directory and insert file info into database
async function finishUpload(uuid) {
    const filetemp = UPLOAD_PATH + '/temp/' + uuid;
    const filepath = UPLOAD_PATH + '/' + (uploadSessions[uuid].previousFile ? uploadSessions[uuid].previousFile.uuid : uuid);

    if ( !utils.MoveFile(filetemp, filepath)) {
        delete uploadSessions[uuid];
        return false;
    }
    const stat = utils.FileStat(filepath);

    if ( !stat) {
        utils.DeleteFile(filepath);
        delete uploadSessions[uuid];
        return false;
    }

    if (uploadSessions[uuid].previousFile) {
        const updateData = {
            last_update: new Date(),
        };
        delete uploadSessions[uuid];

        const response = await db.UpdateData('files', uploadSessions[uuid].previousFile.id, updateData);

        if (response.err)
            return false;
    } else {
        let insertData = {
            uuid: uploadSessions[uuid].uuid,
            user_id: uploadSessions[uuid].user_id,
            patient_id: uploadSessions[uuid].patient_id,
            filename: uploadSessions[uuid].filename,
            display_name: uploadSessions[uuid].display_name,
            extension: uploadSessions[uuid].extension,
            size: stat.size,
            mime_type: uploadSessions[uuid].mime_type
        };

        if (uploadSessions[uuid].folder)
            insertData.folder = uploadSessions[uuid].folder;
        delete uploadSessions[uuid];

        const response = await db.InsertData('files', insertData);

        if (response.err) {
            utils.DeleteFile(filepath);
            console.error(response.err);
            return false;
        }
    }
    return true;
}

module.exports = router;
