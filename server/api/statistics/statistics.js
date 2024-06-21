var express = require('express');
var router = express.Router();
const db = require('../../database');
const utils = require('../../utils');
const axios = require('axios');
const middlewares = require('../../middlewares');

/*router.use('/', async function (req, res, next) {
    await middlewares.RoleMiddleware(req.cookies.userId, 5, res, next);
});*/

const defaultColumnsCount = 10;

router.get('/', async function (req, res, next) {
    let dateFrom, dateTo;

    if (req.query.dateFrom)
        dateFrom = new Date(req.query.dateFrom);
    if (req.query.dateTo)
        dateTo = new Date(req.query.dateTo);

    if ( !dateFrom)
        dateFrom = new Date('2022-10');
    if ( !dateTo)
        dateTo = new Date();

    let statistics = {
        patientsAges: {
            type: 'bar', // pie, bar, line
            data: null,
        },
        patientsServices: {
            type: 'pie',
            data: null,
        },
        contractsStart: {
            type: 'line',
            data: null,
        },
        usersRoles: {
            type: 'pie',
            data: null,
        },
        usersServices: {
            type: 'pie',
            data: null,
        },
        roomsServices: {
            type: 'pie',
            data: null,
        },
        roomsTypes: {
            type: 'pie',
            data: null,
        },
        cloudFilesCreation: {
            type: 'line',
            data: null,
        },
        cloudFilesFolders: {
            type: 'bar',
            data: null,
        },
        planningEventsBegin: {
            type: 'line',
            data: null,
        },
        messagesCreation: {
            type: 'line',
            data: null,
        },
        notificationsCreation: {
            type: 'line',
            data: null,
        },
        notificationsTypes: {
            type: 'pie',
            data: null,
        },
        repairCreation: {
            type: 'line',
            data: null,
        },
        planningEventsCreation: {
            type: 'line',
            data: null,
        }
    };

    // patientsAges
    const now = new Date();
    let response = await db.Select('SELECT birthdate FROM patients ORDER BY birthdate DESC');

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length !== 0) {
        let patientsAges = [];

        for (let i = 0; i !== response.data.length; i++) {
            patientsAges.push(Math.floor((now - new Date(response.data[i].birthdate)) / 31536000000));
        }
        const maxAge = patientsAges[patientsAges.length - 1];
        const ageSlice = Math.ceil(maxAge / defaultColumnsCount);

        statistics.patientsAges.data = new Array(ageSlice);
        let j = 0;
        let countUsers = 0;

        for (let i = 0; i !== defaultColumnsCount; i++) {
            countUsers = 0;

            for (; j !== patientsAges.length && patientsAges[j] <= ageSlice * (i + 1); j++) {
                countUsers++;
            }
            statistics.patientsAges.data[i] = {
                title: (ageSlice * i + 1) + '-' + (ageSlice * (i + 1)),
                value: countUsers
            };
        }
    }

    // patientsServices
    response = await db.Select('SELECT service_id, COUNT(1) as count FROM patients GROUP BY service_id ORDER BY count DESC');

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length !== 0) {
        statistics.patientsServices.data = new Array(response.data.length);

        for (let i = 0; i !== response.data.length; i++) {
            statistics.patientsServices.data[i] = {
                serviceID: response.data[i].service_id,
                title: '',
                value: parseInt(response.data[i].count)
            };
            //total += response.data[i].count;
        }
/*
        for (let i = 0; i !== response.data.length; i++) {
            statistics.patientsServices.data[i].value /= total;
        }*/
        const response2 = await db.Select('SELECT id, title FROM services');

        if (response2.err) {
                console.log(',p');
            res.status(500).send(response2.err);
            return;
        }

        for (let i = 0; i !== response2.data.length; i++) {
            for (let j = 0; j !== statistics.patientsServices.data.length; j++) {
                if (statistics.patientsServices.data[j].serviceID == response2.data[i].id) {
                    statistics.patientsServices.data[j].title = response2.data[i].title;
                    break;
                }
            }
        }
    }

    // contractsStart
    response = await db.Select(`SELECT start_at FROM contract WHERE start_at >= '${utils.FormatSqlDate(dateFrom)}' AND start_at < '${utils.FormatSqlDate(dateTo)}' ORDER BY start_at ASC`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length !== 0) {
        let date, k = 0;
        const sliceLength = Math.floor((dateTo - dateFrom) / defaultColumnsCount);
        statistics.contractsStart.data = new Array(defaultColumnsCount);
        statistics.contractsStart.data[0] = {
            title: dateFrom.toLocaleString(),
            value: 0
        };

        for (let i = 0; i !== response.data.length; i++) {
            date = new Date(response.data[i].start_at);

            if (date > dateFrom.getTime() + sliceLength * (k + 1)) {
                i--;
                k++;

                if (k === defaultColumnsCount)
                    break;
                statistics.contractsStart.data[k] = {
                    title: (new Date(dateFrom.getTime() + sliceLength * k)).toLocaleString(),
                    value: 0
                };
            } else {
                statistics.contractsStart.data[k].value++;
            }
        }
        k++;

        for (; k !== defaultColumnsCount; k++) {
            statistics.contractsStart.data[k] = {
                title: (new Date(dateFrom.getTime() + sliceLength * k)).toLocaleString(),
                value: 0
            };
        }
    }

    // usersRoles
    response = await db.Select('SELECT user_role, COUNT(1) as count FROM users GROUP BY user_role ORDER BY count DESC');

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length !== 0) {
        statistics.usersRoles.data = new Array(response.data.length);

        for (let i = 0; i !== response.data.length; i++) {
            statistics.usersRoles.data[i] = {
                role: response.data[i].user_role,
                title: '',
                value: parseInt(response.data[i].count)
            };
        }
        const response2 = await db.Select('SELECT id, role_name FROM software_role');

        if (response2.err) {
            res.status(500).send(response2.err);
            return;
        }

        for (let i = 0; i !== response2.data.length; i++) {
            for (let j = 0; j !== statistics.usersRoles.data.length; j++) {
                if (statistics.usersRoles.data[j].role == response2.data[i].id) {
                    statistics.usersRoles.data[j].title = response2.data[i].role_name;
                    break;
                }
            }
        }
    }

    // usersServices
    response = await db.Select('SELECT service, COUNT(1) as count FROM users GROUP BY service ORDER BY count DESC');

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length !== 0) {
        statistics.usersServices.data = new Array(response.data.length);

        for (let i = 0; i !== response.data.length; i++) {
            statistics.usersServices.data[i] = {
                serviceID: response.data[i].service,
                title: '',
                value: parseInt(response.data[i].count)
            };
        }
        const response2 = await db.Select('SELECT id, title FROM services');

        if (response2.err) {
            res.status(500).send(response2.err);
            return;
        }

        for (let i = 0; i !== response2.data.length; i++) {
            for (let j = 0; j !== statistics.usersServices.data.length; j++) {
                if (statistics.usersServices.data[j].serviceID == response2.data[i].id) {
                    statistics.usersServices.data[j].title = response2.data[i].title;
                    break;
                }
            }
        }
    }

    // roomsServices
    response = await db.Select('SELECT service_id, COUNT(1) as count FROM rooms GROUP BY service_id ORDER BY count DESC');

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length !== 0) {
        statistics.roomsServices.data = new Array(response.data.length);

        for (let i = 0; i !== response.data.length; i++) {
            statistics.roomsServices.data[i] = {
                serviceID: response.data[i].service_id,
                title: '',
                value: parseInt(response.data[i].count)
            };
        }
        const response2 = await db.Select('SELECT id, title FROM services');

        if (response2.err) {
            res.status(500).send(response2.err);
            return;
        }

        for (let i = 0; i !== response2.data.length; i++) {
            for (let j = 0; j !== statistics.roomsServices.data.length; j++) {
                if (statistics.roomsServices.data[j].serviceID == response2.data[i].id) {
                    statistics.roomsServices.data[j].title = response2.data[i].title;
                    break;
                }
            }
        }
    }

    // roomsTypes
    response = await db.Select('SELECT type, COUNT(1) as count FROM rooms GROUP BY type ORDER BY count DESC');

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length !== 0) {
        statistics.roomsTypes.data = new Array(response.data.length);

        for (let i = 0; i !== response.data.length; i++) {
            statistics.roomsTypes.data[i] = {
                type: response.data[i].type,
                title: '',
                value: parseInt(response.data[i].count)
            };
        }
        const response2 = await db.Select('SELECT id, display_name FROM rooms_types');

        if (response2.err) {
            res.status(500).send(response2.err);
            return;
        }

        for (let i = 0; i !== response2.data.length; i++) {
            for (let j = 0; j !== statistics.roomsTypes.data.length; j++) {
                if (statistics.roomsTypes.data[j].type == response2.data[i].id) {
                    statistics.roomsTypes.data[j].title = response2.data[i].display_name;
                    break;
                }
            }
        }
    }

    // cloudFilesCreation
    response = await db.Select(`SELECT creation FROM files WHERE creation >= '${utils.FormatSqlDate(dateFrom)}' AND creation < '${utils.FormatSqlDate(dateTo)}' ORDER BY creation ASC`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length !== 0) {
        let date, k = 0;
        const sliceLength = Math.floor((dateTo - dateFrom) / defaultColumnsCount);
        statistics.cloudFilesCreation.data = new Array(defaultColumnsCount);
        statistics.cloudFilesCreation.data[0] = {
            title: dateFrom.toLocaleString(),
            value: 0
        };

        for (let i = 0; i !== response.data.length; i++) {
            date = new Date(response.data[i].creation);

            if (date > dateFrom.getTime() + sliceLength * (k + 1)) {
                i--;
                k++;

                if (k === defaultColumnsCount)
                    break;
                statistics.cloudFilesCreation.data[k] = {
                    title: (new Date(dateFrom.getTime() + sliceLength * k)).toLocaleString(),
                    value: 0
                };
            } else {
                statistics.cloudFilesCreation.data[k].value++;
            }
        }
        k++;

        for (; k !== defaultColumnsCount; k++) {
            statistics.cloudFilesCreation.data[k] = {
                title: (new Date(dateFrom.getTime() + sliceLength * k)).toLocaleString(),
                value: 0
            };
        }
    }

    // cloudFilesFolders
    response = await db.Select(`SELECT COUNT(1) as count FROM files WHERE creation >= '${utils.FormatSqlDate(dateFrom)}' AND creation < '${utils.FormatSqlDate(dateTo)}'`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    } else if (response.data.length === 0) {
        res.status(500).send(response.err);
        return;
    }
    statistics.cloudFilesFolders.data = new Array(2);
    statistics.cloudFilesFolders.data[0] = {
        title: 'Fichiers',
        value: response.data[0].count
    }
    response = await db.Select(`SELECT COUNT(1) as count FROM folders WHERE creation >= '${utils.FormatSqlDate(dateFrom)}' AND creation < '${utils.FormatSqlDate(dateTo)}'`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    } else if (response.data.length === 0) {
        res.status(500).send(response.err);
        return;
    }
    statistics.cloudFilesFolders.data[1] = {
        title: 'Dossiers',
        value: response.data[0].count
    }

    if (statistics.cloudFilesFolders.data[0].value == '0' && statistics.cloudFilesFolders.data[1].value == '0')
        statistics.cloudFilesFolders.data = null;

    // planningEventsBegin
    response = await db.Select(`SELECT begin_at FROM planning WHERE begin_at >= '${utils.FormatSqlDate(dateFrom)}' AND begin_at < '${utils.FormatSqlDate(dateTo)}' ORDER BY begin_at ASC`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length !== 0) {
        let date, k = 0;
        const sliceLength = Math.floor((dateTo - dateFrom) / defaultColumnsCount);
        statistics.planningEventsCreation.data = new Array(defaultColumnsCount);
        statistics.planningEventsCreation.data[0] = {
            title: dateFrom.toLocaleString(),
            value: 0
        };

        for (let i = 0; i !== response.data.length; i++) {
            date = new Date(response.data[i].begin_at);

            if (date > dateFrom.getTime() + sliceLength * (k + 1)) {
                i--;
                k++;

                if (k === defaultColumnsCount)
                    break;
                statistics.planningEventsCreation.data[k] = {
                    title: (new Date(dateFrom.getTime() + sliceLength * k)).toLocaleString(),
                    value: 0
                };
            } else {
                statistics.planningEventsCreation.data[k].value++;
            }
        }
        k++;

        for (; k !== defaultColumnsCount; k++) {
            statistics.planningEventsCreation.data[k] = {
                title: (new Date(dateFrom.getTime() + sliceLength * k)).toLocaleString(),
                value: 0
            };
        }
    }

    // messagesCreation
    response = await db.Select(`SELECT send_at FROM msg WHERE send_at >= '${utils.FormatSqlDate(dateFrom)}' AND send_at < '${utils.FormatSqlDate(dateTo)}' ORDER BY send_at ASC`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length !== 0) {
        let date, k = 0;
        const sliceLength = Math.floor((dateTo - dateFrom) / defaultColumnsCount);
        statistics.messagesCreation.data = new Array(defaultColumnsCount);
        statistics.messagesCreation.data[0] = {
            title: dateFrom.toLocaleString(),
            value: 0
        };

        for (let i = 0; i !== response.data.length; i++) {
            date = new Date(response.data[i].send_at);

            if (date > dateFrom.getTime() + sliceLength * (k + 1)) {
                i--;
                k++;

                if (k === defaultColumnsCount)
                    break;
                statistics.messagesCreation.data[k] = {
                    title: (new Date(dateFrom.getTime() + sliceLength * k)).toLocaleString(),
                    value: 0
                };
            } else {
                statistics.messagesCreation.data[k].value++;
            }
        }
        k++;

        for (; k !== defaultColumnsCount; k++) {
            statistics.messagesCreation.data[k] = {
                title: (new Date(dateFrom.getTime() + sliceLength * k)).toLocaleString(),
                value: 0
            };
        }
    }

    // notificationsCreation
    response = await db.Select(`SELECT time FROM notifications WHERE time >= '${utils.FormatSqlDate(dateFrom)}' AND time < '${utils.FormatSqlDate(dateTo)}' ORDER BY time ASC`);

    if (response.err) {
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length !== 0) {
        let date, k = 0;
        const sliceLength = Math.floor((dateTo - dateFrom) / defaultColumnsCount);
        statistics.notificationsCreation.data = new Array(defaultColumnsCount);
        statistics.notificationsCreation.data[0] = {
            title: dateFrom.toLocaleString(),
            value: 0
        };

        for (let i = 0; i !== response.data.length; i++) {
            date = new Date(response.data[i].time);

            if (date > dateFrom.getTime() + sliceLength * (k + 1)) {
                i--;
                k++;

                if (k === defaultColumnsCount)
                    break;
                statistics.notificationsCreation.data[k] = {
                    title: (new Date(dateFrom.getTime() + sliceLength * k)).toLocaleString(),
                    value: 0
                };
            } else {
                statistics.notificationsCreation.data[k].value++;
            }
        }
        k++;

        for (; k !== defaultColumnsCount; k++) {
            statistics.notificationsCreation.data[k] = {
                title: (new Date(dateFrom.getTime() + sliceLength * k)).toLocaleString(),
                value: 0
            };
        }
    }

    // notificationsTypes
    response = await db.Select('SELECT event_type, COUNT(1) as count FROM notifications GROUP BY event_type ORDER BY count DESC');

    if (response.err) {
        console.log(response.err);
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length !== 0) {
        statistics.notificationsTypes.data = new Array(response.data.length);

        for (let i = 0; i !== response.data.length; i++) {
            statistics.notificationsTypes.data[i] = {
                title: response.data[i].event_type,
                value: parseInt(response.data[i].count)
            };
        }
    }

    // repairCreation
    response = await db.Select(`SELECT created_at FROM repair WHERE created_at >= '${utils.FormatSqlDate(dateFrom)}' AND created_at < '${utils.FormatSqlDate(dateTo)}' ORDER BY created_at ASC`);

    if (response.err) {
        console.log(response.err);
        res.status(500).send(response.err);
        return;
    }

    if (response.data.length !== 0) {
        let date, k = 0;
        const sliceLength = Math.floor((dateTo - dateFrom) / defaultColumnsCount);
        statistics.repairCreation.data = new Array(defaultColumnsCount);
        statistics.repairCreation.data[0] = {
            title: dateFrom.toLocaleString(),
            value: 0
        };

        for (let i = 0; i !== response.data.length; i++) {
            date = new Date(response.data[i].created_at);

            if (date > dateFrom.getTime() + sliceLength * (k + 1)) {
                i--;
                k++;

                if (k === defaultColumnsCount)
                    break;
                statistics.repairCreation.data[k] = {
                    title: (new Date(dateFrom.getTime() + sliceLength * k)).toLocaleString(),
                    value: 0
                };
            } else {
                statistics.repairCreation.data[k].value++;
            }
        }
        k++;

        for (; k !== defaultColumnsCount; k++) {
            statistics.repairCreation.data[k] = {
                title: (new Date(dateFrom.getTime() + sliceLength * k)).toLocaleString(),
                value: 0
            };
        }
    }

    res.send(statistics);
});

module.exports = router;
