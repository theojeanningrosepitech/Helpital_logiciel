/**
 * @file index (server routes)
 * @requires express
 * @requires axios
 * @requires os
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const os = require('os');

/**
 * List of routers modules
 */
const authRouter = require('./auth/auth');
const auth2FARouter = require('./auth/2fa');
const authResetPasswordRouter = require('./auth/reset_password');
const backOfficeRouter = require('./backOffice/backOffice');
const backOfficeRoomsRouter = require('./rooms/rooms');
const cloudRouter = require('./cloud/cloud');
const planRouter = require('./plan/plan');
const oAuth2Router = require('./oauth2/oauth2');
const backOfficeInventoryRouter = require('./backOffice/inventory');
const backOfficeAdminRouter = require('./backOffice/admin/admin');
const inventoryRouter = require('./inventory/inventory');
const planningRouter = require('./planning/planning');
const patientsRouter = require('./patients/patients');
const messagingRouter = require('./messaging/messaging');
const fileRouter = require('./file/file');
const profilRouter = require('./profil/profil');
const roomManagementRouter = require('./roomManagement/roomManagement');
const directoryRouter = require('./directory/directory');
const noteRouter = require('./note/note');
const prescriptionRouter = require('./prescritpion/prescription');
const emergencyRouter = require('./emergency/emergency');
//const waitingRouter = require('./rooms/waiting/waiting');
const vehicleRouter = require('./emergency/vehicle');
const doctorsRouter = require('./emergency/doctors');
const nursesRouter = require('./emergency/nurses');
const infoRouter = require('./emergency/information');
const treatmentRoomRouter = require('./emergency/treatment_room');
const searchInventoryRouter = require('./inventory/inventory');
const conversationRouter = require('./conversation/conversation');
const meetingRouter = require('./planning/meeting');
const preferencesRouter = require('./preferences/preferences');
const forbiddenRouter = require('./forbidden/forbidden');
const receptionRouter = require('./reception/reception');
const consultationRouter = require('./consultation/consultation');
const consultationsListRouter = require('./consultationsList/consultationsList');
const operationRouter = require('./operation/operation');
const equipeRouter = require('./equipe/equipe');
const xRaysRouter = require('./xrays/xrays');
const specialistesRouter = require('./specialistes/specialistes');
const exchangeLoanMaterialRouter = require('./exchangeLoanMaterial/exchangeLoanMaterial');
const recruitingRouter = require('./recruiting/recruiting');
const mailPageRouter = require('./mailPage/mailPage');
const recruitingAddRouter = require('./recruiting/recruitingAdd');
const statisticsRouter = require('./statistics/statistics');
const restaurationRouter = require('./restauration/restauration');
const dashboardRouter = require('./dashboard/dashboard');

/**
 * List of routes/paths
 * Link main paths to routes modules
 */
router.use('/auth', authRouter);
router.use('/auth/2fa', auth2FARouter);
router.use('/auth/reset-password', authResetPasswordRouter);
router.use('/back_office', backOfficeRouter);
router.use('/cloud', cloudRouter);
router.use('/file', fileRouter);
router.use('/planning', planningRouter);
router.use('/plan', planRouter);
router.use('/patients', patientsRouter);
router.use('/messaging', messagingRouter);
router.use('/profil', profilRouter);
router.use('/rooms', backOfficeRoomsRouter);
router.use('/back_office/inventory', backOfficeInventoryRouter);
router.use('/back_office/admin', backOfficeAdminRouter);
router.use('/inventory', inventoryRouter);
router.use('/room_management', roomManagementRouter);
router.use('/directory', directoryRouter);
router.use('/note', noteRouter);
router.use('/prescription', prescriptionRouter);
router.use('/emergency', emergencyRouter);
//router.use('/waiting', waitingRouter);
router.use('/vehicle', vehicleRouter);
router.use('/doctors', doctorsRouter);
router.use('/nurses', nursesRouter);
router.use('/information', infoRouter);
router.use('/treatment_room', treatmentRoomRouter);
router.use('/inventory', searchInventoryRouter);
router.use('/conversation', conversationRouter);
router.use('/meeting', meetingRouter);
router.use('/preferences', preferencesRouter);
router.use('/forbidden', forbiddenRouter);
//router.use('/search', searchRouter);
router.use('/equipe', equipeRouter);
router.use('/xrays', xRaysRouter);
router.use('/oauth2', oAuth2Router);
router.use('/consultation', consultationRouter);
router.use('/consultationsList', consultationsListRouter);
router.use('/operation', operationRouter);
router.use('/specialistes', specialistesRouter);
router.use('/exchangeLoanMaterial', exchangeLoanMaterialRouter);
router.use('/reception', receptionRouter);
router.use('/recruiting', recruitingRouter);
router.use('/mailPage', mailPageRouter);
router.use('/recruitingAdd', recruitingAddRouter);
router.use('/statistics', statisticsRouter);
router.use('/dashboard', dashboardRouter);
router.use('/restauration', restaurationRouter);

/**
 * @swagger
 * /:
 *   get:
 *     tags:
 *       - home route
 *     summary: Home page
 *     parameters:
 *      - in: query
 *        name: err
 *        schema:
 *          type: string
 *        description: (optional) error message
 *      - in: query
 *        name: machine_hash
 *        schema:
 *          type: string
 *        description: (optional if cookies.machine_id is present)
 *        example: kjsdflé3kKSFke4sfKRe5kaze
 *      - in: query
 *        name: machine_type
 *        schema:
 *          type: string
 *        description: (optional if cookies.machine_id is present)
 *     responses:
 *       200:
 *         description: Request successfully executed.
 */
router.get('/', async function (req, res, next) {
    let machineID = req.cookies.machine_id;
    const err = req.query.err;
    let response;

    if (typeof machineID === 'undefined' || !machineID) {
        if (typeof req.query.machine_hash === 'undefined' || !req.query.machine_hash || typeof req.query.machine_type === 'undefined' || !req.query.machine_type) {
            res.status(400).send('Missing machine_id');
            return;
        }

        try {
            response = await axios.get(`${process.env.SERVER_ADDRESS}/api/machine/id?id=${req.query.machine_hash}&type=${req.query.machine_type}`);
        } catch (e) {
            try {
                // create one if it doesn't exists
                response = await axios.post(`${process.env.SERVER_ADDRESS}/api/machine/id`, {
                    id: req.query.machine_hash,
                    type: req.query.machine_type
                });
            } catch (e) {
                try {
                    response = await axios.get(`${process.env.SERVER_ADDRESS}/api/integrity/is-valid`);

                    if (response.data.valid)
                        res.render(e.toString());
                    else
                        res.render(response.data.exception);
                    return;
                } catch (e) {
                    res.render(e.toString());
                    return;
                }
            }
        }
        machineID = response.data.id;
        res.cookie('machine_id', machineID);
    }

    try {
        response = await axios.get(`${process.env.SERVER_ADDRESS}/api/machine/users?id=${machineID}`);

        res.locals.users = [];

        for (const item of response.data) {
            let resp = await axios.get(`${process.env.SERVER_ADDRESS}/api/user/login?id=${item.user_id}`);
            res.locals.users.push({ login: resp.data[0].login, id: resp.data[0].id });
        }
        res.locals.title = 'Helpital';
        res.locals.machineId = machineID;
        res.locals.err = err;

        res.render('./login/login');
    } catch (e) {
        res.render(e.toString());
    }
});

//

/**
 * @swagger
 * /close-window:
 *   get:
 *     summary: Get a page that includes code to close the current browser/navigator window
 *     responses:
 *       200:
 *         description: Request successfully executed.
 */
router.get('/close-window', async function (req, res, next) {
    res.render('./closeWindow');
});

module.exports = router;
