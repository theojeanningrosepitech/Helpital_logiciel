const express = require('express');
const router = express.Router();
const utils = require("../../../utils");
const db = require("../../../database");
const uuid = require('uuid');
const FILES_PATH = './server/files/encrypted';

/*
router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});*/


/**
 * @swagger
 * /api/files/folders:
 *   post:
 *     tags:
 *       - files api
 *     summary: Create a cloud folder
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               filename:
 *                 type: string
 *                 example: New folder
 *               folder:
 *                 type: string
 *                 description: folder identifier
 *                 example: 123e4567-e89b-12d3-a456-426614174000 (optional)
 *               patient_id:
 *                 type: integer
 *                 example: 2
 *                 description: link the folder to a patient
 *               shared_users:
 *                 type: array
 *                 example: [14,32,21]
 *                 description: share the folder with several users
 *     responses:
 *       200:
 *         description: A JSON object containing the new folder uuid
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post('/', async function(req, res, next) {
    const userID = await utils.GetUserIdFromSession(req);

    if (userID === -1) {
        res.status(401).send('No session could be found.');
        return;
    }
    let patientID = 0;

    if ( !req.body.filename || req.body.filename === '') {
        res.status(400).send('Missing filename');
        return;
    }
    let folder = null;
    let previousFile;

    if (req.body.patient_id)
        patientID = patient_id;
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
    let filename = req.body.filename;
    let filenameCount = 0;
    let filenameBase = filename;
    let response;

    // alter filename if several folders exists with the same name
    while (1) {
        response = await db.Select(`SELECT id FROM folders WHERE filename = '${filename}' AND user_id = ${userID} AND folder ${folder && folder !== '' ? (' = \'' + folder + '\'') : 'IS NULL'}`);

        if (response.err) {
            res.status(500).send(response.err);
            return;
        }

        if (response.data.length === 0) {
            break;
        }
        filenameCount++;
        filename = filenameBase + ' (' + filenameCount +')';
    }

    const fileUUID = uuid.v4();

    if ( !fileUUID || fileUUID.length != 36) {
        res.sendStatus(500);
        return;
    }
    let insertData = {
        uuid: fileUUID,
        user_id: userID,
        patient_id: patientID,
        filename: filename
    };

    if (folder)
        insertData.folder = folder;
    response = await db.InsertData('folders', insertData);

    if (response.err) {
        console.error(response.err);
        res.sendStatus(500);
        return;
    }
    res.send({uuid: fileUUID});
});


/**
 * @swagger
 * /api/files/folders/user:
 *   get:
 *     tags:
 *       - files api
 *     summary: Get personnal folders info (cloud)
 *     responses:
 *       200:
 *         description: A JSON array containing a list of folders info
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

    wheres.push((req.query.folder && req.query.folder !== '') ?  `folder = '${req.query.folder}'` : 'folder IS NULL');

    if (req.query.search && req.query.search !== '')
        wheres.push(`filename LIKE '%${decodeURIComponent(req.query.search)}%'`);
    const response = await db.Select(`SELECT uuid, user_id, patient_id, filename, creation, last_update FROM folders WHERE user_id = '${userID}' AND ` + wheres.join(' AND ') + ' ORDER BY filename');

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
    }
    res.send(response.data);
});

/**
 * @swagger
 * /api/files/folders/user/shared:
 *   get:
 *     tags:
 *       - files api
 *     summary: Get folders shared by others (cloud)
 *     responses:
 *       200:
 *         description: A JSON array containing a list of folders info
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

    wheres.push((req.query.folder && req.query.folder !== '') ?  `folder = '${req.query.folder}'` : 'folder IS NULL');

    if (req.query.search && req.query.search !== '')
        wheres.push(`filename LIKE '%${decodeURIComponent(req.query.search)}%'`);
    const response = await db.Select(`SELECT uuid, user_id, patient_id, filename, creation, last_update FROM folders WHERE uuid IN (SELECT file_uuid FROM files_shared_users WHERE user_id = ${userID}) AND ${wheres.join(' AND ')} ORDER BY filename`);

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
    }
    res.send(response.data);
});


/**
 * @swagger
 * /api/files/folders/user/favorites:
 *   get:
 *     tags:
 *       - files api
 *     summary: Get favorite folders (cloud)
 *     responses:
 *       200:
 *         description: A JSON array containing a list of folders info
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

    if (req.query.search && req.query.search !== '')
        wheres.push(`filename LIKE '%${decodeURIComponent(req.query.search)}%'`);

    if (req.query.folder && req.query.folder !== '') {
        wheres.push(`folder = '${req.query.folder}'`);
        response = await db.Select(`SELECT uuid, user_id, patient_id, filename, creation, last_update FROM folders WHERE ${wheres.join(' AND ')} ORDER BY filename`);
    } else {
        response = await db.Select(`SELECT uuid, user_id, patient_id, filename, creation, last_update FROM folders WHERE uuid IN (SELECT file_uuid FROM files_favorite_users WHERE user_id = ${userID})` + (wheres.length !== 0 ? `AND ${wheres.join(' AND ')}` : '') + ` ORDER BY filename`);
    }

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
    }
    res.send(response.data);
});

/**
 * @swagger
 * /api/files/folders/user/recent:
 *   get:
 *     tags:
 *       - folders api
 *     summary: Get recent folders (cloud)
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

    if (req.query.search && req.query.search !== '')
        wheres.push(`filename LIKE '%${decodeURIComponent(req.query.search)}%'`);
    if (req.query.folder && req.query.folder !== '') {
        wheres.push(`folder = '${req.query.folder}'`);
    }
    const response = await db.Select(`SELECT uuid, user_id, patient_id, filename, creation, last_update FROM folders WHERE (uuid IN (SELECT file_uuid FROM files_shared_users WHERE user_id = ${userID}) OR user_id = '${userID}')` + (wheres.length !== 0 ? `AND ${wheres.join(' AND ')}` : '') + ` ORDER BY last_update DESC`);

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
    }
    res.send(response.data);
});

/**
 * @swagger
 * /api/files/folders/information:
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

    if ( !req.query.uuid || req.query.uuid == '') {
        res.sendStatus(400);
        return;
    }
    let response = await db.Select(`SELECT uuid, user_id, patient_id, filename, creation, last_update FROM folders WHERE uuid = '${req.query.uuid}'`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length === 0) {
        res.sendStatus(400);
        return;
    }
    let folder = response.data[0];

    folder.shared_users = await getSharedUsers(folder.uuid);

    if ( !folder.shared_users) {
        res.sendStatus(500);
        return;
    }
    folder.favorite = await isFavoriteFile(folder.uuid, userID);

    if (folder.favorite === null) {
        res.sendStatus(500);
        return;
    }

    if (req.query.detailed === 'true') {
        response = await db.Select(`SELECT id, login, user_role, firstname, lastname FROM users WHERE id = '${folder.user_id}'`);

        if (response.err) {
            res.status(500).send(response.err);
            return;
        }

        if (response.data.length !== 0) {
            folder.creator = response.data[0];
        } else {
            folder.creator = null;
        }

        if (folder.shared_users.length !== 0) {
            response = await db.Select(`SELECT id, firstname, lastname FROM users WHERE id IN (${folder.shared_users.join(',')})`);

            if (response.err) {
                res.status(500).send(response.err);
                return;
            }
            folder.shared_users_details = response.data;
        } else {
            folder.shared_users_details = [];
        }
    }
    res.send(folder);
});

/**
 * @swagger
 * /api/files/folders:
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
    let response = await db.Select(`SELECT id, user_id FROM folders WHERE uuid = '${id}'`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length === 0) {
        res.sendStatus(400);
        return;
    }

    // check if user has required access to delete the folder created by another user
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

    if (! await deleteFolder(response.data[0].id)) {
        res.status(500).send('Error while deleting folder.');
        return;
    }
    res.send('Ressource deleted.');
});

/**
 * Delete recursively a folder and every folders and files it contains
 * @param {string} folderID - Folder identifier
 */
async function deleteFolder(folderID) {
    // get sub-folders
    let response = await db.Select(`SELECT uuid FROM folders WHERE folder = '${folderID}'`);

    if (response.err) {
        console.error(response.err);
        return false;
    }

    for (let i = 0; i !== response.data.length; i++) {
        if (!(await deleteFolder(response.data[i])))
            return false;
    }

    // delete files
    response = await db.Select(`SELECT uuid FROM files WHERE folder = '${folderID}'`);

    if (response.err) {
        console.error(response.err);
        return false;
    }
    let resp2, resp3;

    for (let i = 0; i !== response.data.length; i++) {
        resp2 = await db.Select(`SELECT id FROM files_shared_users WHERE file_uuid = '${response.data[i]}'`);

        if (resp2.err) {
            console.error(resp2.err);
            return false;
        }

        for (let i = 0; i !== resp2.data.length; i++) {
            resp3 = await db.DeleteData('files_shared_users', resp2.data[i].id);

            if (resp3.err) {
                console.error(resp3.err);
                return false;
            }
        }
        resp2 = await db.DeleteData('files', response.data[i]);

        if (resp2.err) {
            console.error(resp2.err);
            return false;
        }
        utils.DeleteFile(FILES_PATH + '/' + response.data[i]);
    }
    response = await db.Select(`SELECT id FROM files_shared_users WHERE file_uuid = '${folderID}'`);

    if (response.err) {
        console.error(response.err);
        return false;
    }

    for (let i = 0; i !== response.data.length; i++) {
        resp2 = await db.DeleteData('files_shared_users', response.data[i].id);

        if (resp2.err) {
            console.error(resp2.err);
            return false;
        }
    }
    // delete current folder
    response = await db.DeleteData('folders', folderID);

    if (response.err) {
        console.error(response.err);
        return false;
    }
    return true;
}

/**
 * @swagger
 * /api/files/folders/filename:
 *   put:
 *     tags:
 *       - folders api
 *     summary: Update a filename
 *     parameters:
 *      - in: query
 *        name: id
 *        schema:
 *          type: string
 *        description: identifier of the folder
 *        example: 123e4567-e89b-12d3-a456-426614174000
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               filename:
 *                 type: string
 *                 example: simple_text_folder
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
    let response = await db.Select(`SELECT id FROM folders WHERE uuid = '${id}'`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length === 0) {
        res.sendStatus(400);
        return;
    }
    const folderID = response.data[0].id;

    // check if another file uses the same name
    response = await db.Select(`SELECT id FROM files WHERE filename = '${req.body.filename}' AND id != '${folderID}'`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length !== 0) {
        res.sendStatus(409);
        return;
    }

    response = await db.UpdateData('folders', folderID, {
        filename: req.body.filename
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
 * /api/files/folders/patient:
 *   put:
 *     tags:
 *       - files api
 *     summary: Update a patient id linked to the folder
 *     parameters:
 *      - in: query
 *        name: id
 *        schema:
 *          type: string
 *        description: identifier of the folder
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
    let response = await db.Select(`SELECT id FROM folders WHERE uuid = '${id}'`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length === 0) {
        res.sendStatus(400);
        return;
    }
    const fileID = response.data[0].id;

    response = await db.UpdateData('folders', fileID, {
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
