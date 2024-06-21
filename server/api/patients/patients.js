var express = require('express');
var router = express.Router();
const db = require('../../database');
const utils = require('../../utils');
const axios = require("axios");
const middlewares = require('../../middlewares');
const websocket = require('../../websocket');
const {FormatSqlDate} = require("../../utils");

/*router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});*/

/**
 * @swagger
 * /api/patients:
 *   get:
 *     tags:
 *      - patients api
 *     summary: Get a list of patients
 *     parameters:
 *      - in: query
 *        name: Cookie sessionID
 *        schema:
 *          type: string
 *        description: session ID
 *        example: BdKLj3RGiD67F4kOF4
 *      - in: query
 *        name: roomID
 *        schema:
 *          type: integer
 *        description: room ID
 *        example: 17
 *      - in: query
 *        name: serviceID
 *        schema:
 *          type: integer
 *        description: service ID
 *        example: 2
 *      - in: query
 *        name: roomType
 *        schema:
 *          type: string
 *        description: room type
 *        example: patient
 *      - in: query
 *        name: floor
 *        schema:
 *          type: integer
 *        description: floor
 *        example: 3
 *     responses:
 *       200:
 *         description: A JSON array containing a list of all patients.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.get('/', async function (req, res, next) {
    let where = [];

    // add where clauses
    if (req.query.id)
        where.push('id = ' + req.query.id);
    else {
        if (req.query.search)
            where.push('(firstname LIKE E\'%' + db.EscapeQuote(req.query.search) + '%\' OR lastname LIKE E\'%' + db.EscapeQuote(req.query.search) + '%\' OR ss_number LIKE \'%' + req.query.search + '%\')')
        if (req.query.room_id)
            where.push('room_id = ' + req.query.room_id);
        if (req.query.service_id)
            where.push('room_id IN (SELECT id FROM rooms WHERE service_id = ' + req.query.service_id + ')');
        if (req.query.room_type)
            where.push('room_id IN (SELECT id FROM rooms WHERE type = ' + req.query.room_type + ')');
        if (req.query.floor)
            where.push('room_id IN (SELECT id FROM rooms WHERE floor = ' + req.query.floor + ')');
    }
    let query = 'SELECT * FROM patients';

    if (where.length != 0)
        query += ' WHERE ' + where.join(' AND ');
    let response = await db.Select(query);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }
    let patients = response.data;

    for (let i = patients.length - 1; i !== -1; i--) {
        response = await db.Select('SELECT * FROM rooms WHERE id = ' + patients[i].room_id);

        if (response.err) {
            res.status(500).send(response.err);
            return;
        }

        if (response.data)
            patients[i].room = response.data[0];

        // cloud files
        response = await db.Select(`SELECT uuid, user_id, patient_id, filename, display_name, extension, mime_type, size, creation, last_update FROM files WHERE patient_id = '${patients[i].id}' ORDER BY id DESC`);

        if (response.err) {
            res.status(500).send(response.err);
            return;
        }

        if (response.data)
            patients[i].cloud_files = response.data;

        // patient files
        response = await db.Select(`SELECT id, filename, type, size, create_at, modify_at, content FROM patient_files WHERE patient_id = '${patients[i].id}' ORDER BY id DESC`);

        if (response.err) {
            res.status(500).send(response.err);
            return;
        }

        if (response.data)
            patients[i].files = response.data;

        // patient archives
        response = await db.Select(`SELECT id, filename, type, size, create_at, modify_at, content FROM patient_archives WHERE patient_id = '${patients[i].id}' ORDER BY id DESC`);

        if (response.err) {
            res.status(500).send(response.err);
            return;
        }

        if (response.data)
            patients[i].archives = response.data;
    }

    // services
    response = await db.Select(`SELECT id, title FROM services`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    for (let i = 0; i !== response.data.length; i++) {
        for (let j = 0; j !== patients.length; j++) {
            if (patients[j].service_id == response.data[i].id) {
                patients[j].service = response.data[i].title;
                break;
            }
        }
    }

    // doctors
    response = await db.Select(`SELECT id, firstname, lastname FROM users`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    for (let i = 0; i !== response.data.length; i++) {
        for (let j = 0; j !== patients.length; j++) {
            if (patients[j].doctor_id == response.data[i].id) {
                patients[j].doctor = response.data[i].firstname + ' ' + response.data[i].lastname;
                break;
            }
        }
    }

    // replace undefined values
    for (let j = 0; j !== patients.length; j++) {
        if (patients[j].service === undefined)
            patients[j].service = '';
        if (patients[j].doctor === undefined)
            patients[j].doctor = '';
    }

    const patient_files = await db.Select(`select * from patient_files`);
    const patient_archives = await db.Select(`select * from patient_archives`);
    const notes = await db.Select(`select * from note`);
    const prescriptions = await db.Select(`select * from prescription`);
    const priority = await db.Select(`select * from note_priority`);
    // ERREUR dans la db (Bryan)
    //const my_user = await db.Select(`select * from users WHERE id = ` + req.query.user_id);

    const capsule = {
        patients: patients,
        patient_files: patient_files,
        patient_archives: patient_archives,
        notes: notes,
        prescriptions: prescriptions,
        priority: priority
        //my_user: my_user,
    }

    res.send(capsule);
});

/**
 * @swagger
 * /api/patients:
 *   get:
 *     tags:
 *      - patients api
 *     summary: Get a list of social security number of all the patients
 *     parameters:
 *      - in: query
 *        name: Cookie sessionID
 *        schema:
 *          type: string
 *        description: session ID
 *        example: BdKLj3RGiD67F4kOF4
 *      - in: query
 *        name: roomID
 *        schema:
 *          type: integer
 *        description: room ID
 *        example: 17
 *      - in: query
 *        name: serviceID
 *        schema:
 *          type: integer
 *        description: service ID
 *        example: 2
 *      - in: query
 *        name: roomType
 *        schema:
 *          type: string
 *        description: room type
 *        example: patient
 *      - in: query
 *        name: floor
 *        schema:
 *          type: integer
 *        description: floor
 *        example: -2
 *     responses:
 *       200:
 *         description: A JSON array containing a list of social security number of all the patients.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.get('/ss', async function (req, res, next) {
    let where = [];
    // add where clauses
    if (req.query.id)
        where.push('id = ' + req.query.id);
    else {
        if (req.query.search)
            where.push('(firstname LIKE E\'%' + db.EscapeQuote(req.query.search) + '%\' OR lastname LIKE E\'%' + db.EscapeQuote(req.query.search) + '%\' OR ss_number LIKE \'%' + req.query.search + '%\')')
        if (req.query.room_id)
            where.push('room_id = ' + req.query.room_id);
        if (req.query.service_id)
            where.push('room_id IN (SELECT id FROM rooms WHERE service_id = ' + req.query.service_id + ')');
        if (req.query.room_type)
            where.push('room_id IN (SELECT id FROM rooms WHERE type = ' + req.query.room_type + ')');
        if (req.query.floor)
            where.push('room_id IN (SELECT id FROM rooms WHERE floor = ' + req.query.floor + ')');

    }
    let query = 'SELECT id, ss_number FROM patients';

    if (where.length != 0)
        query += ' WHERE ' + where.join(' AND ');

    let response = await db.Select(query);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }
    res.send(response.data);
});

/**
 * @swagger
 * /api/patients:
 *   post:
 *     tags:
 *      - patients api
 *     summary: Add a patient to the current patients list
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstname:
 *                 type: string
 *                 example: Tao
 *               lastname:
 *                 type: string
 *                 example: James
 *               birthdate:
 *                 type: string
 *                 example: 2000-07-19 12:00:00
 *               ss_number:
 *                 type: string
 *                 example: 0123456789012
 *               room_id:
 *                 type: integer
 *                 example: 4
 *     responses:
 *       200:
 *         description: Patient successfully added
 *         content:
 *           plain/text:
 *             example: Data inserted
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.post('/', async function(req, res) {
    utils.parseTimestamps(req.body, [ 'birthdate' ]);

    if ( !req.body.blood_type)
        req.body.blood_type = '';
    const result = await utils.PostController(req, res, 'patients');

    if (result)
        websocket.sendMessage(req, 'new', 'patient', { id: result.id }, result.data, null);
});

/**
 * @swagger
 * /api/patients:
 *   put:
 *     tags:
 *      - patients api
 *     summary: Change informations of a patient
 *     parameters:
 *      - in: query
 *        name: id
 *        schema:
 *          type: integer
 *        description: patient ID of the patient
 *        example: 2
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstname:
 *                 type: string
 *                 example: Tao
 *               lastname:
 *                 type: string
 *                 example: James
 *               birthdate:
 *                 type: string
 *                 example: 2000-07-19 12:00:00
 *               ss_number:
 *                 type: string
 *                 example: 0123456789012
 *               room_id:
 *                 type: string
 *                 example: 4
 *     responses:
 *       200:
 *         description: Patient successfully modified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *                   example: Patient updated
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.put('/', async function(req, res) {
    const data = req.body;
    const id = req.query.id;
    
    utils.parseTimestamps(req.body, [ 'birthdate' ]);
    const result = await db.UpdateData('patients', id, data);

    // const result = await utils.PutController(req, res, 'patients');

    if (result)
        websocket.sendMessage(req, 'update', 'patient', { id: result.id }, result.data, null);

    if (result.err) {
        res.status(500).json({error: result.err});
        return;
    }
    res.status(200).json({response: 'Patient updated'});
});

/**
 * @swagger
 * /api/patients:
 *   delete:
 *     tags:
 *      - patients api
 *     summary: Remove a patient from the current patients list
 *     parameters:
 *      - in: query
 *        name: id
 *        schema:
 *          type: integer
 *        description: patient ID of the patient to delete
 *        example: 2
 *     responses:
 *       200:
 *         description: Patient successfully modified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *                   example: Row deleted
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.delete('/', async function(req, res) {
    const result = await utils.DeleteController(req, res, 'patients');

    if (result)
        websocket.sendMessage(req, 'delete', 'patient', { id: result.id }, null, null);
});

/**
 * @swagger
 * /api/patients/ss:
 *   get:
 *     tags:
 *      - patients api
 *     summary: Get a patient with his social security number
 *     parameters:
 *      - in: query
 *        name: ss_number
 *        schema:
 *          type: string
 *        description: social security number
 *        example: 0123456789012
 *     responses:
 *       200:
 *         description: A JSON array containing the patient informations.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       400:
 *         description: Bad parameters
 *       401:
 *         description: Bad credentials
 *       500:
 *         description: Internal server error
 */
router.get('/ss/:ss', async function (req, res, next) {
    const response = await db.Select(`select * from patients where ss_number = '${req.params.ss}'`);

    if (response.err)
        res.status(500).send(response.err);
    else
        res.send(response.data);
});

router.delete('/favoris', async function(req, res) {
    let id = req.query.id.toString();
   // const result = await db.DeleteData('favoris', id);
   await db.Select(`DELETE FROM favoris WHERE id = ${req.query.id}`)
    websocket.sendMessage(req, 'delete', 'patients/favoris', { id: id }, {id: id}, null);

    res.status(200);

});

router.post('/favoris', async function(req, res) {
    const data = {
            user_id: req.query.user_id,
            patient_id: req.query.patient_id,
            creation_date: new Date()
        };
    const result = await db.InsertData('favoris', data);

    if (result.err) {
        res.status(500).json({error: result.err});
        return;
    }
    res.status(200).json({message: 'favoris save', id: result.data});

   // websocket.sendMessage(req, 'new', 'favoris', { id: result.data }, insertData, receivers);
});

router.get('/favoris', async function (req, res) {
    let favoris;

    if (req.query.id)
        favoris = await db.Select(`SELECT * FROM favoris WHERE user_id = ${req.query.id}`)
    if (favoris.err)
        res.status(500).send(favoris.err);
    else
        res.send(favoris.data);
});

module.exports = router;
