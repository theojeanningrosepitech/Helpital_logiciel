const express = require('express');
const router = express.Router();
const utils = require("../../utils");
const db = require("../../database");
const FILES_PATH = './server/files/encrypted';

router.use('/upload', require('./upload/upload'));
router.use('/folders', require('./folders/folders'));

/*
router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});*/

/**
 * @swagger
 * /api/files/user:
 *   get:
 *     tags:
 *       - files api
 *     summary: Get personnal files info (cloud)
 *     responses:
 *       200:
 *         description: A JSON array containing a list of files info
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.get('/user', async function(req, res, next) {
    const userID = await utils.GetUserIdFromSession(req);

    if (userID === -1) {
        res.status(401).send('No session could be found.');
        return;
    }
    let wheres = [];
    let orderColumn = 'filename';
    let orderBy = 'DESC';

    wheres.push((req.query.folder && req.query.folder !== '') ?  `folder = '${req.query.folder}'` : 'folder IS NULL');

    if (req.query.search && req.query.search !== '')
        wheres.push(`filename LIKE '%${decodeURIComponent(req.query.search)}%'`);
    if (req.query.orderBy && req.query.orderBy !== '')
        orderBy = req.query.orderBy;
    if (req.query.orderColumn && req.query.orderColumn !== '')
        orderColumn = req.query.orderColumn;
    const response = await db.Select(`SELECT uuid, user_id, folder, patient_id, filename, display_name, extension, mime_type, size, creation, last_update FROM files WHERE user_id = '${userID}' AND ${wheres.join(' AND ')} ORDER BY ${orderColumn} ${orderBy}`);

    if (response.err) {
        res.status(500).send(response.err);
        console.error(response.err);
        return;
    }

    for (let i = 0; i !== response.data.length; i++) {
        response.data[i].shared_users = await getSharedUsers(response.data[i].uuid);

        if ( !response.data[i].shared_users) {
            res.sendStatus(500);
            return;
        }
        response.data[i].favorite = await isFavoriteFile(response.data[i].uuid, userID);

        if (response.data[i].favorite === null) {
            res.sendStatus(500);
            return;
        }
        setFilePreview(response.data[i]);
    }
    res.send(response.data);
});

/**
 * @swagger
 * /api/files/user/shared:
 *   get:
 *     tags:
 *       - files api
 *     summary: Get files shared by others (cloud)
 *     responses:
 *       200:
 *         description: A JSON array containing a list of files info
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.get('/user/shared', async function(req, res, next) {
    const userID = await utils.GetUserIdFromSession(req);

    if (userID === -1) {
        res.status(401).send('No session could be found.');
        return;
    }
    let wheres = [];
    let orderColumn = 'filename';
    let orderBy = 'DESC';

    wheres.push((req.query.folder && req.query.folder !== '') ?  `folder = '${req.query.folder}'` : 'folder IS NULL');

    if (req.query.search && req.query.search !== '')
        wheres.push(`filename LIKE '%${decodeURIComponent(req.query.search)}%'`);
    if (req.query.orderBy && req.query.orderBy !== '')
        orderBy = req.query.orderBy;
    if (req.query.orderColumn && req.query.orderColumn !== '')
        orderColumn = req.query.orderColumn;
    const response = await db.Select(`SELECT uuid, user_id, patient_id, filename, display_name, extension, mime_type, size, creation, last_update FROM files WHERE uuid IN (SELECT file_uuid FROM files_shared_users WHERE user_id = ${userID}) AND ${wheres.join(' AND ')} ORDER BY ${orderColumn} ${orderBy}`);

    if (response.err) {
        console.log(response.err);
        res.status(500).send(response.err);
        return;
    }

    for (let i = 0; i !== response.data.length; i++) {
        response.data[i].shared_users = await getSharedUsers(response.data[i].uuid);

        if ( !response.data[i].shared_users) {
            res.sendStatus(500);
            return;
        }
        response.data[i].favorite = await isFavoriteFile(response.data[i].uuid, userID);

        if (response.data[i].favorite === null) {
            res.sendStatus(500);
            return;
        }
        setFilePreview(response.data[i]);
    }
    res.send(response.data);
});

/**
 * @swagger
 * /api/files/user/favorites:
 *   get:
 *     tags:
 *       - files api
 *     summary: Get favorites files (cloud)
 *     responses:
 *       200:
 *         description: A JSON array containing a list of files info
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.get('/user/favorites', async function(req, res, next) {
    const userID = await utils.GetUserIdFromSession(req);

    if (userID === -1) {
        res.status(401).send('No session could be found.');
        return;
    }
    let wheres = [];
    let orderColumn = 'filename';
    let orderBy = 'DESC';
    let response;

    if (req.query.search && req.query.search !== '')
        wheres.push(`filename LIKE '%${decodeURIComponent(req.query.search)}%'`);
    if (req.query.orderBy && req.query.orderBy !== '')
        orderBy = req.query.orderBy;
    if (req.query.orderColumn && req.query.orderColumn !== '')
        orderColumn = req.query.orderColumn;
    if (req.query.folder && req.query.folder !== '') {
        wheres.push(`folder = '${req.query.folder}'`);
        response = await db.Select(`SELECT uuid, user_id, patient_id, filename, display_name, extension, mime_type, size, creation, last_update FROM files WHERE ${wheres.join(' AND ')} ORDER BY ${orderColumn} ${orderBy}`);
    } else {
        response = await db.Select(`SELECT uuid, user_id, patient_id, filename, display_name, extension, mime_type, size, creation, last_update FROM files WHERE uuid IN (SELECT file_uuid FROM files_favorite_users WHERE user_id = ${userID})` + (wheres.length !== 0 ? `AND ${wheres.join(' AND ')}` : '') + ` ORDER BY ${orderColumn} ${orderBy}`);
    }

    if (response.err) {
        console.log(response.err);
        res.status(500).send(response.err);
        return;
    }

    for (let i = 0; i !== response.data.length; i++) {
        response.data[i].shared_users = await getSharedUsers(response.data[i].uuid);

        if ( !response.data[i].shared_users) {
            res.sendStatus(500);
            return;
        }
        response.data[i].favorite = await isFavoriteFile(response.data[i].uuid, userID);

        if (response.data[i].favorite === null) {
            res.sendStatus(500);
            return;
        }
        setFilePreview(response.data[i]);
    }
    res.send(response.data);
});

/**
 * @swagger
 * /api/files/user/recent:
 *   get:
 *     tags:
 *       - files api
 *     summary: Get recent files (cloud)
 *     responses:
 *       200:
 *         description: A JSON array containing a list of files info
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.get('/user/recent', async function(req, res, next) {
    const userID = await utils.GetUserIdFromSession(req);

    if (userID === -1) {
        res.status(401).send('No session could be found.');
        return;
    }
    let wheres = [];
    let orderColumn = 'last_update';
    let orderBy = 'DESC';

    if (req.query.search && req.query.search !== '')
        wheres.push(`filename LIKE '%${decodeURIComponent(req.query.search)}%'`);
    if (req.query.orderBy && req.query.orderBy !== '')
        orderBy = req.query.orderBy;
    if (req.query.orderColumn && req.query.orderColumn !== '')
        orderColumn = req.query.orderColumn;
    if (req.query.folder && req.query.folder !== '') {
        wheres.push(`folder = '${req.query.folder}'`);
    }
    const response = await db.Select(`SELECT uuid, user_id, patient_id, filename, display_name, extension, mime_type, size, creation, last_update FROM files WHERE (uuid IN (SELECT file_uuid FROM files_shared_users WHERE user_id = ${userID}) OR user_id = '${userID}')` + (wheres.length !== 0 ? `AND ${wheres.join(' AND ')}` : '') + ` ORDER BY ${orderColumn} ${orderBy}`);

    if (response.err) {
        console.log(response.err);
        res.status(500).send(response.err);
        return;
    }

    for (let i = 0; i !== response.data.length; i++) {
        response.data[i].shared_users = await getSharedUsers(response.data[i].uuid);

        if ( !response.data[i].shared_users) {
            res.sendStatus(500);
            return;
        }
        response.data[i].favorite = await isFavoriteFile(response.data[i].uuid, userID);

        if (response.data[i].favorite === null) {
            res.sendStatus(500);
            return;
        }
        setFilePreview(response.data[i]);
    }
    res.send(response.data);
});

/**
 * @swagger
 * /api/files/patient:
 *   get:
 *     tags:
 *       - files api
 *     summary: Get files info of a patients
 *     parameters:
 *      - in: query
 *        name: patient_id
 *        schema:
 *          type: integer
 *        description: identifier of a patient
 *        example: 2
 *     responses:
 *       200:
 *         description: A JSON array containing a list of files info
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get('/patient', async function(req, res, next) {

    if ( !req.query.patient_id || req.query.patient_id == '') {
        res.sendStatus(400);
        return;
    }
    let wheres = [];
    let orderColumn = 'filename';
    let orderBy = 'DESC';

    wheres.push((req.query.folder && req.query.folder !== '') ?  `folder = '${req.query.folder}'` : 'folder IS NULL');

    if (req.query.search && req.query.search !== '')
        wheres.push(`filename LIKE '%${decodeURIComponent(req.query.search)}%'`);
    if (req.query.orderBy && req.query.orderBy !== '')
        orderBy = req.query.orderBy;
    if (req.query.orderColumn && req.query.orderColumn !== '')
        orderColumn = req.query.orderColumn;
    const response = await db.Select(`SELECT uuid, user_id, patient_id, filename, display_name, extension, mime_type, size, creation, last_update FROM files WHERE patient_id = '${req.query.patient_id}' AND ${wheres.join(' AND ')} ORDER BY ${orderColumn} ${orderBy}`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    for (let i = 0; i !== response.data.length; i++) {
        response.data[i].shared_users = await getSharedUsers(response.data[i].uuid);

        if ( !response.data[i].shared_users) {
            res.sendStatus(500);
            return;
        }
        response.data[i].favorite = await isFavoriteFile(response.data[i].uuid, userID);

        if (response.data[i].favorite === null) {
            res.sendStatus(500);
            return;
        }
        setFilePreview(response.data[i]);
    }
    res.send(response.data);
});

/**
 * @swagger
 * /api/files/information:
 *   get:
 *     tags:
 *       - files api
 *     summary: Get a file information
 *     parameters:
 *      - in: query
 *        name: uuid
 *        schema:
 *          type: string
 *        description: identifier of the file
 *        example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: A JSON object containing a the file info
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get('/information', async function(req, res, next) {
    const userID = await utils.GetUserIdFromSession(req);

    if (userID === -1) {
        res.status(401).send('No session could be found.');
        return;
    }
    const filePath = FILES_PATH + '/' + req.query.uuid;

    if ( !req.query.uuid || req.query.uuid == '') {
        res.sendStatus(400);
        return;
    }
    let response = await db.Select(`SELECT uuid, user_id, patient_id, filename, display_name, extension, mime_type, size, creation, last_update FROM files WHERE uuid = '${req.query.uuid}'`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length === 0) {
        res.sendStatus(400);
        return;
    }
    let file = response.data[0];

    file.shared_users = await getSharedUsers(file.uuid);

    if ( !file.shared_users) {
        res.sendStatus(500);
        return;
    }
    file.favorite = await isFavoriteFile(file.uuid, userID);

    if (file.favorite === null) {
        res.sendStatus(500);
        return;
    }
    setFilePreview(file);

    if (req.query.detailed === 'true') {
        response = await db.Select(`SELECT id, login, user_role, firstname, lastname FROM users WHERE id = '${file.user_id}'`);

        if (response.err) {
            res.status(500).send(response.err);
            return;
        }

        if (response.data.length !== 0) {
            file.creator = response.data[0];
        } else {
            file.creator = null;
        }

        if (file.patient_id !== 0) {
            response = await db.Select(`SELECT id, firstname, lastname FROM patients WHERE id = '${file.patient_id}'`);

            if (response.err) {
                res.status(500).send(response.err);
                return;
            }
            file.patient = response.data[0];
        } else {
            file.patient = null;
        }

        if (file.shared_users.length !== 0) {
            response = await db.Select(`SELECT id, firstname, lastname FROM users WHERE id IN (${file.shared_users.join(',')})`);

            if (response.err) {
                res.status(500).send(response.err);
                return;
            }
            file.shared_users_details = response.data;
        } else {
            file.shared_users_details = [];
        }
    }
    res.send(file);
});

/**
 * @swagger
 * /api/files/filename:
 *   put:
 *     tags:
 *       - files api
 *     summary: Update a filename
 *     parameters:
 *      - in: query
 *        name: id
 *        schema:
 *          type: string
 *        description: identifier of the file
 *        example: 123e4567-e89b-12d3-a456-426614174000
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               filename:
 *                 type: string
 *                 example: simple_text_file
 *     responses:
 *       200:
 *         description: File successfully deleted
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/filename', async function(req, res, next) {
    const userID = await utils.GetUserIdFromSession(req);

    if (userID === -1) {
        res.status(401).send('No session could be found.');
        return;
    }
    let id;

    if (req.query.id)
        id = req.query.id;
    else if (req.query.uuid)
        id = req.query.uuid;

    if ( !id || id == '') {
        res.sendStatus(400);
        return;
    }

    if ( !req.body.filename || req.body.filename == '') {
        res.sendStatus(400);
        return;
    }
    // check if file exists in database
    let response = await db.Select(`SELECT id, extension FROM files WHERE uuid = '${id}'`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length === 0) {
        res.sendStatus(400);
        return;
    }
    const newFilename = req.body.filename + '.' + response.data[0].extension;
    const fileID = response.data[0].id;

    // check if another file uses the same name
    response = await db.Select(`SELECT id FROM files WHERE filename = '${newFilename}' AND id != '${fileID}'`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length !== 0) {
        res.sendStatus(409);
        return;
    }

    response = await db.UpdateData('files', fileID, {
        filename: newFilename,
        display_name: req.body.filename
    });

    if (response.err) {
        if (response.err == "Missing data") {
            res.status(400).json({ error: "Empty statement" });
        } else if (response.err == "Missing id") {
            res.status(400).json({ error: "\'id'\ is missing" });
        } else {
            res.status(500).send(response.err);
        }
    } else {
        res.status(200).json({ response: 'Row updated' });
    }
});

/**
 * @swagger
 * /api/files/patient:
 *   put:
 *     tags:
 *       - files api
 *     summary: Update a patient id linked to the file
 *     parameters:
 *      - in: query
 *        name: id
 *        schema:
 *          type: string
 *        description: identifier of the file
 *        example: 123e4567-e89b-12d3-a456-426614174000
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               patient_id:
 *                 type: number
 *                 example: 14
 *     responses:
 *       200:
 *         description: File successfully deleted
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/patient', async function(req, res, next) {
    const userID = await utils.GetUserIdFromSession(req);

    if (userID === -1) {
        res.status(401).send('No session could be found.');
        return;
    }
    let id;

    if (req.query.id)
        id = req.query.id;
    else if (req.query.uuid)
        id = req.query.uuid;

    if ( !id || id == '') {
        res.sendStatus(400);
        return;
    }

    if ( !req.body.patient_id || req.body.patient_id == '') {
        res.sendStatus(400);
        return;
    }
    // check if file exists in database
    let response = await db.Select(`SELECT id FROM files WHERE uuid = '${id}'`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length === 0) {
        res.sendStatus(400);
        return;
    }
    const fileID = response.data[0].id;

    response = await db.UpdateData('files', fileID, {
        patient_id: req.body.patient_id
    });

    if (response.err) {
        if (response.err == "Missing data") {
            res.status(400).json({ error: "Empty statement" });
        } else if (response.err == "Missing id") {
            res.status(400).json({ error: "\'id'\ is missing" });
        } else {
            res.status(500).send(response.err);
        }
    } else {
        res.status(200).json({ response: 'Row updated' });
    }
});

/**
 * @swagger
 * /api/files:
 *   delete:
 *     tags:
 *       - files api
 *     summary: Delete a file
 *     parameters:
 *      - in: query
 *        name: id
 *        schema:
 *          type: string
 *        description: identifier of the file
 *        example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: File successfully deleted
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete('/', async function(req, res, next) {
    const userID = await utils.GetUserIdFromSession(req);

    if (userID === -1) {
        res.status(401).send('No session could be found.');
        return;
    }
    let id;

    if (req.query.id)
        id = req.query.id;
    else if (req.query.uuid)
        id = req.query.uuid;

    if ( !id || id == '') {
        res.sendStatus(400);
        return;
    }
    // check if file exists in database
    let response = await db.Select(`SELECT id, user_id FROM files WHERE uuid = '${id}'`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length === 0) {
        res.sendStatus(400);
        return;
    }

    // check if user has required access to delete the file created by another user
    if (response.data[0].user_id !== userID) {
        let responseUsers = await db.Select(`SELECT (SELECT user_role FROM users WHERE id = '${response.data[0].user_id}') <= (SELECT user_role FROM users WHERE id = '${userID}')`);

        if (responseUsers.err) {
            res.status(500).send(responseUsers.err);
            return;
        }

        if (responseUsers.data.bool === 0) {
            res.sendStatus(401);
            return;
        }
    }
    response = await db.DeleteData('files', response.data[0].id);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }
    utils.DeleteFile(FILES_PATH + '/' + id);
    res.send('Ressource deleted.');
});

/**
 * @swagger
 * /api/files/shared-users:
 *   post:
 *     tags:
 *       - files folders api
 *     summary: Append a user to shared_users of a file or a folder
 *     parameters:
 *      - in: query
 *        name: uuid
 *        schema:
 *          type: string
 *        description: identifier of the file
 *        example: 123e4567-e89b-12d3-a456-426614174000
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: number
 *                 example: 13
 *     responses:
 *       201:
 *         description: Success
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post('/shared-users', async function(req, res, next) {
    const userID = await utils.GetUserIdFromSession(req);

    if (userID === -1) {
        res.status(401).send('No session could be found.');
        return;
    }

    if ( !req.query.uuid || req.query.uuid === '') {
        res.status(400).send('Missing uuid');
        return;
    }
    if ( !req.body.user_id || req.body.user_id === '') {
        res.status(400).send('Missing user_id');
        return;
    }
    const response = await db.InsertData('files_shared_users', {
        file_uuid: req.query.uuid,
        user_id: req.body.user_id,
    });

    if (response.err) {
        console.error(response.err);
        res.sendStatus(500);
        return;
    }
    res.sendStatus(201);
});

/**
 * @swagger
 * /api/files/favorite:
 *   post:
 *     tags:
 *       - files folders api
 *     summary: Append a user to favorite_users of a file or a folder
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               uuid:
 *                 type: string
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       201:
 *         description: Success
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post('/favorite', async function(req, res, next) {
    const userID = await utils.GetUserIdFromSession(req);

    if (userID === -1) {
        res.status(401).send('No session could be found.');
        return;
    }

    if ( !req.body.uuid || req.body.uuid === '') {
        res.status(400).send('Missing uuid');
        return;
    }
    const response = await db.InsertData('files_favorite_users', {
        file_uuid: req.body.uuid,
        user_id: userID,
    });

    if (response.err) {
        console.error(response.err);
        res.sendStatus(500);
        return;
    }
    res.sendStatus(201);
});

/**
 * @swagger
 * /api/files/shared-users:
 *   delete:
 *     tags:
 *       - files folders api
 *     summary: Remove a shared user of a file/folder
 *     parameters:
 *      - in: query
 *        name: uuid
 *        schema:
 *          type: string
 *        description: identifier of the file
 *        example: 123e4567-e89b-12d3-a456-426614174000
 *      - in: query
 *        name: user_id
 *        schema:
 *          type: string
 *        description: identifier of the user
 *        example: 14
 *     responses:
 *       200:
 *         description: File successfully deleted
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete('/shared-users', async function(req, res, next) {
    const userID = await utils.GetUserIdFromSession(req);

    if (userID === -1) {
        res.status(401).send('No session could be found.');
        return;
    }
    let id;

    if (req.query.id)
        id = req.query.id;
    else if (req.query.uuid)
        id = req.query.uuid;

    if ( !id || id == '') {
        res.sendStatus(400);
        return;
    } else if ( !req.query.user_id || req.query.user_id == '') {
        res.sendStatus(400);
        return;
    }
    // check if file exists in database
    let response = await db.Select(`SELECT id FROM files_shared_users WHERE file_uuid = '${id}' AND user_id = '${req.query.user_id}'`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length === 0) {
        res.sendStatus(400);
        return;
    }
    response = await db.DeleteData('files_shared_users', response.data[0].id);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }
    res.send('Ressource deleted.');
});

/**
 * @swagger
 * /api/files/favorite:
 *   delete:
 *     tags:
 *       - files folders api
 *     summary: Remove a favorite user of a file/folder
 *     parameters:
 *      - in: query
 *        name: uuid
 *        schema:
 *          type: string
 *        description: identifier of the file
 *        example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: File successfully deleted
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete('/favorite', async function(req, res, next) {
    const userID = await utils.GetUserIdFromSession(req);

    if (userID === -1) {
        res.status(401).send('No session could be found.');
        return;
    }
    let id;

    if (req.query.id)
        id = req.query.id;
    else if (req.query.uuid)
        id = req.query.uuid;

    if ( !id || id == '') {
        res.sendStatus(400);
        return;
    }
    // check if file exists in database
    let response = await db.Select(`SELECT id FROM files_favorite_users WHERE file_uuid = '${id}' AND user_id = '${userID}'`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length === 0) {
        res.sendStatus(400);
        return;
    }
    response = await db.DeleteData('files_favorite_users', response.data[0].id);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }
    res.send('Ressource deleted.');
});

/**
 * Set a preview uri related to the ressource type (image, text, binary...)
 * @param {object} file - File object
 */
function setFilePreview(file) {

    if (file.extension === 'pdf' || file.extension === 'PDF') {
        file.preview = '/images/icon_pdf.png';
    } else if (file.mime_type === 'application/octet-stream' || file.mime_type === 'application/html' || file.mime_type === 'application/css' || file.mime_type === 'application/javascript' || file.mime_type === 'application/php' || file.mime_type === 'font/woff' || file.mime_type === 'font/woff2' || file.mime_type === 'font/otf' || file.mime_type === 'font/ttf') {
        file.preview = '/images/icon_terminal.png';
    } else if (file.mime_type === 'image/jpeg' || file.mime_type === 'image/png' || file.mime_type === 'image/vnd.microsoft.icon' || file.mime_type === 'image/gif' || file.mime_type === 'image/heic' || file.mime_type === 'image/heif' || file.mime_type === 'image/webp' || file.mime_type === 'image/svg+xml' || file.mime_type === 'image/bmp' || file.mime_type === 'image/tiff') {
        file.preview = '/file?uuid=' + file.uuid;
        // file.preview = '/images/icon_picture.png';
    } else if (file.mime_type === 'video/mpeg' || file.mime_type === 'video/webm' || file.mime_type === 'video/x-msvideo' || file.mime_type === 'video/ogg' || file.mime_type === 'video/mp4') {
        file.preview = '/images/icon_video.png';
    } else if (file.mime_type === 'audio/mpeg' || file.mime_type === 'audio/wav' || file.mime_type === 'audio/ogg' || file.mime_type === 'audio/webm' || file.mime_type === 'audio/opus' || file.mime_type === 'audio/aac') {
        file.preview = '/images/icon_music.png';
    } else if (file.mime_type === 'application/vnd.rar' || file.mime_type === 'application/zip' || file.mime_type === 'application/x-7z-compressed' || file.mime_type === 'application/x-tar' || file.mime_type === 'application/gzip' || file.mime_type === 'application/x-bzip' || file.mime_type === 'application/x-bzip2') {
        file.preview = '/images/icon_zip.png';
    } else
        file.preview = '/images/icon_file.png';
}

async function getSharedUsers(uuid) {
    const response = await db.Select(`SELECT user_id FROM files_shared_users WHERE file_uuid = '${uuid}'`);

    if (response.err) {
        console.error(response.err);
        return null;
    }
    let users = [];

    for (let user of response.data)
        users.push(user.user_id);
    return users;
}

async function isFavoriteFile(uuid, userID) {
    const response = await db.Select(`SELECT id FROM files_favorite_users WHERE file_uuid = '${uuid}' AND user_id = '${userID}'`);

    if (response.err) {
        console.error(response.err);
        return null;
    }

    return response.data.length;
}

module.exports = router;
