var express = require('express');
var router = express.Router();
const db = require('../database');
const axios = require("axios");

/**
 * List of API routers modules
 */
const authRouter = require('./auth/auth');
const userRouter = require('./user/user');
const contactRouter = require('./contacts/contacts');
const machineRouter = require('./machine/machine');
const backOfficeRouter = require('./backOffice/backOffice');
const inventoryRouter = require('./inventory/inventory');
const inventoryTypesRouter = require('./inventory/types');
const planningRouter = require('./planning/planning');
const patientsRouter = require('./patients/patients');
const servicesRouter = require('./services/services');
const filesRouter = require('./files/files');
const roomsRouter = require('./rooms/rooms');
const oAuth2Router = require('./oauth2/oauth2');
const roomsTypesRouter = require('./rooms/types');
const usersRouter = require('./users/users');
const supervisorsRouter = require('./supervisors/supervisors');
const messagesRouter = require('./messages/messages');
const conversationsRouter = require('./conversations/conversations');
//const waitingRouter = require('./rooms/waiting/waiting');
const vehicleRouter = require('./emergency/vehicle');
const treatmentRoomRouter = require('./emergency/treatment_room');
const meetingRouter = require('./planning/meeting');
const noteRouter = require('./note/note');
const prescriptionRouter = require('./prescription/prescription');
const rolesRouter = require('./roles/roles');
const avatarsRouter = require('./avatars/avatars');
const bannerRouter = require('./banner/banner');
const uploadRouter = require('./upload/upload');
const xRaysRouter = require('./xrays/xrays');
const patientFilesRouter = require('./patientFiles/patientFiles');
const notificationRouter = require('./notifications/notifications');
const integrityRouter = require('./integrity/integrity');
const logServiceRouter = require('./log/service/service');
const servicesGroupsRouter = require('./services/groups/groups');
const availabilityServiceRouter = require('./availability/availability');
const specialistesRouter = require('./specialistes/specialistes');
const recruitingRouter = require('./recruiting/recruiting');
const inventory_other_hospitalRouter = require('./inventory_other_hospital/inventory_other_hospital');
const exchangeLoanMaterialRouter = require('./exchangeLoanMaterial/exchangeLoanMaterial');
const mailPageRouter = require('./mailPage/mailPage');
const insultRouter = require('./insult/insult');
const webSiteRouter = require('./website/website');
const contractServiceRouter = require('./contract/contract');
const ordersRouter = require('./orders/orders');
const statisticsRouter = require('./statistics/statistics');
const restaurationRouter = require('./restauration/restauration');

//const sitevitrineRouter = require('./sitevitrine/contact');

//const searchPatientRouter = require('./searchPatient/searchPatient');
const preferencesRouter = require('./preferences/preferences');

/**
 * List of API routes/paths
 * Link API main paths to API routes modules
 */
router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/contacts', contactRouter);
router.use('/machine', machineRouter);
router.use('/backoffice', backOfficeRouter);
router.use('/inventory', inventoryRouter);
router.use('/inventory/types', inventoryTypesRouter);
router.use('/planning', planningRouter);
router.use('/patients', patientsRouter);
router.use('/services', servicesRouter);
router.use('/rooms', roomsRouter);
router.use('/rooms/types', roomsTypesRouter);
router.use('/users', usersRouter);
router.use('/supervisors', supervisorsRouter);
router.use('/files', filesRouter);
router.use('/messages', messagesRouter);
router.use('/conversations', conversationsRouter);
//router.use('/waiting', waitingRouter);
router.use('/vehicle', vehicleRouter);
router.use('/treatment_room', treatmentRoomRouter);
router.use('/meeting', meetingRouter);
router.use('/note', noteRouter);
router.use('/prescription', prescriptionRouter);
router.use('/roles', rolesRouter);
router.use('/avatars', avatarsRouter);
router.use('/banner', bannerRouter);
router.use('/xrays', xRaysRouter);
router.use('/oauth2', oAuth2Router);
router.use('/patient_files', patientFilesRouter);
router.use('/website', webSiteRouter);
router.use('/preferences', preferencesRouter);
router.use('/log/service', logServiceRouter);
router.use('/services/groups', servicesGroupsRouter);
router.use('/availability', availabilityServiceRouter);
router.use('/upload', uploadRouter);
router.use('/contract', contractServiceRouter);
router.use('/integrity', integrityRouter);
router.use('/notifications', notificationRouter);
router.use('/specialistes', specialistesRouter);
router.use('/recruiting', recruitingRouter);
router.use('/inventory_other_hospital', inventory_other_hospitalRouter);
router.use('/exchangeLoanMaterial', exchangeLoanMaterialRouter);
router.use('/mailPage', mailPageRouter);
router.use('/insult', insultRouter);
router.use('/orders', ordersRouter);
router.use('/statistics', statisticsRouter);
//router.use('/searchPatient', searchPatientRouter);
router.use('/restauration', restaurationRouter);

/**
 * @swagger
 * /api/ping:
 *   get:
 *     summary: Retrieve a pong.
 *     description: This endpoint is just for a test purpose.
 *     responses:
 *      200:
 *          description: pong
 */
router.get('/ping', function (req, res, next) {
    res.status(200).send('pong');
})

module.exports = router;
