const express = require('express');
const router = express.Router();
const axios = require('axios');
const middlewares = require('../middlewares');
const navigation = require('../navigation');
const utils = require('../utils');

/*
router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});
*/

/**
 * @swagger
 * /cloud:
 *   get:
 *     tags:
 *       - cloud route
 *     summary: Get the cloud main page
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/', async function (req, res, next) {
    let queries = [];

    if (req.query.folder && req.query.folder !== '')
        queries.push('folder=' + req.query.folder);
    if (req.query.search && req.query.search !== '')
        queries.push('search=' + req.query.search);
    if (req.query.orderBy && req.query.orderBy !== '')
        queries.push('orderBy=' + req.query.orderBy);
    if (req.query.orderColumn && req.query.orderColumn !== '')
        queries.push('orderColumn=' + req.query.orderColumn);
    const files = await axios.get(process.env.SERVER_ADDRESS + '/api/files/user?' + queries.join('&'), {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});
    const folders = await axios.get(process.env.SERVER_ADDRESS + '/api/files/folders/user?' + queries.join('&'), {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});
    let folderName = '';

    if (files.err) {
        res.sendStatus(500).send(files.err);
        console.error(files.err);
        return;
    }

    if (folders.err) {
        res.sendStatus(500).send(folders.err);
        console.error(folders.err);
        return;
    }

    if (req.query.folder) {
        const folderInfo = await axios.get(`${process.env.SERVER_ADDRESS}/api/files/folders/information?uuid=${req.query.folder}`, {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});

        if (folderInfo.err) {
            res.sendStatus(500).send(folders.err);
            console.error(folders.err);
            return;
        }
        folderName = 'Dossier: ' + folderInfo.data.filename;
    }
    const imagePreview = [''];

    files.data.forEach((file) => {
        file.formatedSize = utils.FormatSize(file.size);
        file.formatedCreationDate = utils.FormatDate(new Date(file.creation));
    });

    res.locals.data = {
        files: files.data,
        folders: folders.data,
        location: '/cloud',
        folder_name: folderName,
        search: (req.query.search && req.query.search !== '') ? decodeURIComponent(req.query.search) : '',
        orderColumn: (req.query.orderColumn && req.query.orderColumn !== '') ? req.query.orderColumn : '',
        orderBy: (req.query.orderBy && req.query.orderBy !== '') ? req.query.orderBy : '',
    };
    res.locals.navigation = navigation.Get(req, navigation.routes.cloud.sub.cloud);
    res.render('./cloud/cloud')
});

/*
 * @swagger
 * /cloud/shared:
 *   get:
 *     tags:
 *       - cloud route
 *     summary: Get shared files from the cloud
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/shared', async function (req, res, next) {
    let queries = [];

    if (req.query.folder && req.query.folder !== '')
        queries.push('folder=' + req.query.folder);
    if (req.query.search && req.query.search !== '')
        queries.push('search=' + req.query.search);
    if (req.query.orderBy && req.query.orderBy !== '')
        queries.push('orderBy=' + req.query.orderBy);
    if (req.query.orderColumn && req.query.orderColumn !== '')
        queries.push('orderColumn=' + req.query.orderColumn);
    const files = await axios.get(process.env.SERVER_ADDRESS + '/api/files/user/shared?' + queries.join('&'), {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});
    const folders = await axios.get(process.env.SERVER_ADDRESS + '/api/files/folders/user/shared?' + queries.join('&'), {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});
    let folderName = '';

    if (files.err) {
        res.sendStatus(500).send(files.err);
        console.error(files.err);
        return;
    }

    if (folders.err) {
        res.sendStatus(500).send(folders.err);
        console.error(folders.err);
        return;
    }

    if (req.query.folder) {
        const folderInfo = await axios.get(`${process.env.SERVER_ADDRESS}/api/files/folders/information?uuid=${req.query.folder}`, {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});

        if (folderInfo.err) {
            res.sendStatus(500).send(folders.err);
            console.error(folders.err);
            return;
        }
        folderName = 'Dossier: ' + folderInfo.data.filename;
    }
    const imagePreview = [''];

    files.data.forEach((file) => {
        file.formatedSize = utils.FormatSize(file.size);
        file.formatedCreationDate = utils.FormatDate(new Date(file.creation));
    });

    res.locals.data = {
        files: files.data,
        folders: folders.data,
        location: '/cloud/shared',
        folder_name: folderName,
        search: (req.query.search && req.query.search !== '') ? decodeURIComponent(req.query.search) : '',
        orderColumn: (req.query.orderColumn && req.query.orderColumn !== '') ? req.query.orderColumn : '',
        orderBy: (req.query.orderBy && req.query.orderBy !== '') ? req.query.orderBy : '',
    };
    res.locals.navigation = navigation.Get(req, navigation.routes.cloud.sub.shared);

    res.render('./cloud/cloud')
});

/*
 * @swagger
 * /cloud/favorites:
 *   get:
 *     tags:
 *       - cloud route
 *     summary: Get favorites files from the cloud
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/favorites', async function (req, res, next) {
    let queries = [];

    if (req.query.folder && req.query.folder !== '')
        queries.push('folder=' + req.query.folder);
    if (req.query.search && req.query.search !== '')
        queries.push('search=' + req.query.search);
    if (req.query.orderBy && req.query.orderBy !== '')
        queries.push('orderBy=' + req.query.orderBy);
    if (req.query.orderColumn && req.query.orderColumn !== '')
        queries.push('orderColumn=' + req.query.orderColumn);
    const files = await axios.get(process.env.SERVER_ADDRESS + '/api/files/user/favorites?' + queries.join('&'), {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});
    const folders = await axios.get(process.env.SERVER_ADDRESS + '/api/files/folders/user/favorites?' + queries.join('&'), {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});
    let folderName = '';

    if (files.err) {
        res.sendStatus(500).send(files.err);
        console.error(files.err);
        return;
    }

    if (folders.err) {
        res.sendStatus(500).send(folders.err);
        console.error(folders.err);
        return;
    }

    if (req.query.folder) {
        const folderInfo = await axios.get(`${process.env.SERVER_ADDRESS}/api/files/folders/information?uuid=${req.query.folder}`, {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});

        if (folderInfo.err) {
            res.sendStatus(500).send(folders.err);
            console.error(folders.err);
            return;
        }
        folderName = 'Dossier: ' + folderInfo.data.filename;
    }
    const imagePreview = [''];

    files.data.forEach((file) => {
        file.formatedSize = utils.FormatSize(file.size);
        file.formatedCreationDate = utils.FormatDate(new Date(file.creation));
    });

    res.locals.data = {
        files: files.data,
        folders: folders.data,
        location: '/cloud/favorites',
        folder_name: folderName,
        search: (req.query.search && req.query.search !== '') ? decodeURIComponent(req.query.search) : '',
        orderColumn: (req.query.orderColumn && req.query.orderColumn !== '') ? req.query.orderColumn : '',
        orderBy: (req.query.orderBy && req.query.orderBy !== '') ? req.query.orderBy : '',
    };
    res.locals.navigation = navigation.Get(req, navigation.routes.cloud.sub.favorites);
    res.render('./cloud/cloud')
});

/*
 * @swagger
 * /cloud/recent:
 *   get:
 *     tags:
 *       - cloud route
 *     summary: Get recent files from the cloud
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/recent', async function (req, res, next) {
    let queries = [];

    if (req.query.folder && req.query.folder !== '')
        queries.push('folder=' + req.query.folder);
    if (req.query.search && req.query.search !== '')
        queries.push('search=' + req.query.search);
    if (req.query.orderBy && req.query.orderBy !== '')
        queries.push('orderBy=' + req.query.orderBy);
    if (req.query.orderColumn && req.query.orderColumn !== '')
        queries.push('orderColumn=' + req.query.orderColumn);
    const files = await axios.get(process.env.SERVER_ADDRESS + '/api/files/user/recent?' + queries.join('&'), {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});
    const folders = await axios.get(process.env.SERVER_ADDRESS + '/api/files/folders/user/recent?' + queries.join('&'), {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});
    let folderName = '';

    if (files.err) {
        res.sendStatus(500).send(files.err);
        console.error(files.err);
        return;
    }

    if (folders.err) {
        res.sendStatus(500).send(folders.err);
        console.error(folders.err);
        return;
    }

    if (req.query.folder) {
        const folderInfo = await axios.get(`${process.env.SERVER_ADDRESS}/api/files/folders/information?uuid=${req.query.folder}`, {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});

        if (folderInfo.err) {
            res.sendStatus(500).send(folders.err);
            console.error(folders.err);
            return;
        }
        folderName = 'Dossier: ' + folderInfo.data.filename;
    }
    const imagePreview = [''];

    files.data.forEach((file) => {
        file.formatedSize = utils.FormatSize(file.size);
        file.formatedCreationDate = utils.FormatDate(new Date(file.creation));
    });

    res.locals.data = {
        files: files.data,
        folders: folders.data,
        location: '/cloud/recent',
        folder_name: folderName,
        search: (req.query.search && req.query.search !== '') ? decodeURIComponent(req.query.search) : '',
        orderColumn: (req.query.orderColumn && req.query.orderColumn !== '') ? req.query.orderColumn : '',
        orderBy: (req.query.orderBy && req.query.orderBy !== '') ? req.query.orderBy : '',
    };
    res.locals.navigation = navigation.Get(req, navigation.routes.cloud.sub.recent);
    res.render('./cloud/cloud')
});

/*
 * @swagger
 * /cloud/favorites:
 *   get:
 *     tags:
 *       - cloud route
 *     summary: Get favorites files from the cloud
 *     responses:
 *       200:
 *         description: Request successfully executed.
 *       500:
 *         description: Internal serveur error.
 */
router.get('/favorites', async function (req, res, next) {
    let queries = [];

    if (req.query.folder && req.query.folder !== '')
        queries.push('folder=' + req.query.folder);
    if (req.query.search && req.query.search !== '')
        queries.push('search=' + req.query.search);
    if (req.query.orderBy && req.query.orderBy !== '')
        queries.push('orderBy=' + req.query.orderBy);
    if (req.query.orderColumn && req.query.orderColumn !== '')
        queries.push('orderColumn=' + req.query.orderColumn);
    const files = await axios.get(process.env.SERVER_ADDRESS + '/api/files/user/favorites?' + queries.join('&'), {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});
    const folders = await axios.get(process.env.SERVER_ADDRESS + '/api/files/folders/user/favorites?' + queries.join('&'), {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});
    let folderName = '';

    if (files.err) {
        res.sendStatus(500).send(files.err);
        console.error(files.err);
        return;
    }

    if (folders.err) {
        res.sendStatus(500).send(folders.err);
        console.error(folders.err);
        return;
    }

    if (req.query.folder) {
        const folderInfo = await axios.get(`${process.env.SERVER_ADDRESS}/api/files/folders/information?uuid=${req.query.folder}`, {withCredentials: true, headers:{Cookie: utils.GetRawCookie(req.cookies)}});

        if (folderInfo.err) {
            res.sendStatus(500).send(folders.err);
            console.error(folders.err);
            return;
        }
        folderName = 'Dossier: ' + folderInfo.data.filename;
    }
    const imagePreview = [''];

    files.data.forEach((file) => {
        file.formatedSize = utils.FormatSize(file.size);
        file.formatedCreationDate = utils.FormatDate(new Date(file.creation));
    });

    res.locals.data = {
        files: files.data,
        folders: folders.data,
        location: '/cloud/favorites',
        folder_name: folderName,
        search: (req.query.search && req.query.search !== '') ? decodeURIComponent(req.query.search) : '',
        orderColumn: (req.query.orderColumn && req.query.orderColumn !== '') ? req.query.orderColumn : '',
        orderBy: (req.query.orderBy && req.query.orderBy !== '') ? req.query.orderBy : '',
    };
    res.locals.navigation = navigation.Get(req, navigation.routes.cloud.sub.favorites);
    res.render('./cloud/cloud')
});

module.exports = router;
