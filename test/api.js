process.env.NODE_ENV = 'test';
const assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app');
const db = require('../server/database');
const should = chai.should();

chai.use(chaiHttp);

function login(userID) {
/*    let user = {
        login: 'arthur.petit',
        password: '$2b$10$ZLyf/WEKFfH8pVkZOV/wsetZdq8plNta0MDoqjY.8H6oU7eqMh5k.',
    };

    for (const user in users) {
        if (user.id == userID) {
            user = user;
        }
    }*/
/*    chai.request(server)
    .post('/api/login', {
        login: 'arthur.petit',
        password: 'password',
        machineId: ''
    })
    .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        res.body.length.should.be.equal(22);
        const data = res.body;

        for (let element of data) {
            for (let item of inventory) {
                if (item.id === element.id) {
                    assert(item.title === element.title);
                    assert(item.type === element.type.id);
                }
            }
        }
        done();
    });*/

    return '';
}
/*
describe('API Back', () => {

    // declare data that will be used in tests
    const planning = [{
            title: 'Opération',
            description: 'Opération du fois en urgence',
            user_id: 1,
            begin_at: '2042-05-02 09:00:00',
            end_at: '2042-05-02 10:00:00',
            duration: 3600,
        }, {
            title: 'Analyse urine',
            description: 'Analyse de l urine',
            user_id: 1,
            begin_at: '2042-05-02 14:00:00',
            end_at: '2042-05-02 16:00:00',
            duration: 7200,
        }, {
            title: 'Analyse de sang',
            description: 'Prise de sang',
            user_id: 1,
            begin_at: '2042-05-02 16:00:00',
            end_at: '2042-05-02 16:16:00',
            duration: 1000,
        }, {
            title: 'Opération',
            description: 'Opération de l appendice',
            user_id: 1,
            begin_at: '2042-04-02 14:00:00',
            end_at: '2042-04-02 18:00:00',
            duration: 14400,
        }, {
            title: 'Opération',
            description: 'Opération de la hanche',
            user_id: 1,
            begin_at: '2042-05-16 11:00:00',
            end_at: '2042-05-16 11:30:00',
            duration: 1800,
        },
    ];

    const services = [
        { title: 'Radiologie' },
        { title: 'Cardiologie' },
        { title: 'Pédiatrie' },
        { title: 'Pneumologie' },
        { title: 'Neurologie' },
        { title: 'Cancerologie' },
        { title: 'Néphrologie' },
        { title: 'Psychologie' },
        { title: 'Soins palliatifs' },
    ];

    const rooms = [{
            title: 'Bloc opératoire',
            type: 3,
            service_id: 2,
            floor: -1,
            capacity: 2,
            position_x: -5,
            position_y: -8,
            size_x: 10,
            size_y: 15,
            supervisor: 2
        }, {
            title: 'Cagibi',
            type: 1,
            service_id: 4,
            floor: 1,
            capacity: 0,
            position_x: -5,
            position_y: -3,
            size_x: 3,
            size_y: 2,
            supervisor: 2
        }, {
            title: 'R1',
            type: 2,
            service_id: 1,
            floor: 1,
            capacity: 1,
            position_x: -3,
            position_y: -5,
            size_x: 3,
            size_y: 4,
            supervisor: 2
        }, {
            title: 'R2',
            type: 2,
            service_id: 4,
            floor: 1,
            capacity: 1,
            position_x: -3,
            position_y: 1,
            size_x: 3,
            size_y: 4,
            supervisor: 2
        }, {
            title: 'R3',
            type: 2,
            capacity: 1,
            service_id: 4,
            floor: 1,
            position_x: -3,
            position_y: 1,
            size_x: 3,
            size_y: 4,
            supervisor: 2
        }, {
            title: 'A1',
            type: 2,
            service_id: 6,
            floor: 2,
            capacity: 1,
            position_x: -3,
            position_y: -5,
            size_x: 3,
            size_y: 4,
            supervisor: 2
        }, {
            title: 'A2',
            type: 2,
            service_id: 6,
            floor: 2,
            capacity: 1,
            position_x: -3,
            position_y: 1,
            size_x: 3,
            size_y: 4,
            supervisor: 2
        },
    ];

    const roomsTypes = [{
            display_name: 'Pièce neutre'
        },
        {
            display_name: 'Chambre'
        },
        {
            display_name: 'Salle d opération'
        },
        {
            display_name: 'Salle de consultation'
        },
    ];

    const patients = [{
            firstname: 'Axel',
            lastname: 'Bertin',
            birthdate: '2000-07-19 12:00:00',
            ss_number: '0123456789024',
            room_id: 1,
        }, {
            firstname: 'Alize',
            lastname: 'Charles',
            birthdate: '1999-02-21 12:00:00',
            ss_number: '0123456789025',
            room_id: 4,
        }, {
            firstname: 'Audrey',
            lastname: 'Noel',
            birthdate: '1995-11-12 12:00:00',
            ss_number: '0123456789026',
            room_id: 5,
        }, {
            firstname: 'Emma',
            lastname: 'Gaillard',
            birthdate: '1997-05-02 12:00:00',
            ss_number: '0123456789027',
            room_id: 1,
        }, {
            firstname: 'Lucas',
            lastname: 'Roy',
            birthdate: '1974-07-04 12:00:00',
            ss_number: '0123456789028',
            room_id: 4,
        }, {
            firstname: 'Lucas',
            lastname: 'Leroux',
            birthdate: '1985-08-06 12:00:00',
            ss_number: '0123456789029',
        },
    ];

    const inventory = [{
            type: 2,
            title: 'Scalpel',
            room_id: 2,
            quantity: 1,
        }, {
            type: 1,
            title: 'Respirateur',
            room_id: 3,
            quantity: 4,
        }, {
            type: 1,
            title: 'Respirateur',
            room_id: 1,
            quantity: 2,
        }, {
            type: 1,
            title: 'Respirateur',
            room_id: 3,
            quantity: 5,
        }
    ];

    const inventoryTypes = [
        {
            name: 'surgery_tool',
            display_name: 'Outil chirurgical'
        },
        {
            name: 'medical_device',
            display_name: 'Appareil médical'
        },
    ];

    const conversation = [{
        content: 'Salut tony, tu peux venir au bloc C',
        picture: null,
        file: null,
        send_at: '2021-05-02 14:00:00',
        sender_id: 1,
        receiver_id: 4,
        state: 1
    },
    {
        content: `Oui juju j'arrive tous de suite ma caille`,
        picture: null,
        file: null,
        send_at: '2021-05-02 14:02:00',
        sender_id: 4,
        receiver_id: 1,
        state: 1
    }];

    // insert test data into test database
    before(async function() {

        return new Promise(async (resolve) => {
            await planning.forEach(async function(event, key) {
                const result = await db.InsertData('planning', event);

                if (result.err) {
                    console.log(result.err);
                    return;
                }
                planning[key].id = result.data;
            });

            await patients.forEach(async function(object, key) {
                const result = await db.InsertData('patients', object);

                if (result.err) {
                    console.log(result.err);
                    return;
                }
                patients[key].id = result.data;
            });

            await inventory.forEach(async function(object, key) {
                const result = await db.InsertData('inventory', object);

                if (result.err) {
                    console.log(result.err);
                    return;
                }
                inventory[key].id = result.data;
            });

            await inventoryTypes.forEach(async function(object, key) {
                const result = await db.InsertData('inventory_types', object);

                if (result.err) {
                    console.log(result.err);
                    return;
                }
                inventoryTypes[key].id = result.data;
            });

            await rooms.forEach(async function(object, key) {
                const result = await db.InsertData('rooms', object);

                if (result.err) {
                    console.log(result.err);
                    return;
                }
                rooms[key].id = result.data;
            });

            await roomsTypes.forEach(async function(object, key) {
                const result = await db.InsertData('rooms_types', object);

                if (result.err) {
                    console.log(result.err);
                    return;
                }
                roomsTypes[key].id = result.data;
            });

            let i = 0;
            await services.forEach(async function(object, key) {
                const result = await db.InsertData('services', object);

                if (result.err) {
                    console.log(result.err);
                    return;
                }
                services[key].id = result.data;
                i++;

                if (i === services.length)
                    resolve();
            });
        });
    });

/*
    describe('waiting_room', () => {

        it('Get waiting_room', function(done) {
            chai.request(server)
            .get('/api/rooms/waiting')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.be.equal(16);
                const data = res.body;

                for (let element of data) {
                    for (let waiting_room of rooms) {
                        if (waiting_room.id === element.id) {
                            assert(waiting_room.title === element.title);
                            assert(waiting_room.floor === element.floor);
                            assert(waiting_room.service_id === element.service_id);
                        }
                    }
                }
                done();
            });
        });

       /* it('Get rooms from service_id', function(done) {
            chai.request(server)
            .get('/api/rooms?service_id=4')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.be.equal(7);
                done();
            });
        });*
    });


    // delete all test data added to the test database
    after(async function() {
        let ids = [];

        for (let elem of planning)
            ids.push(elem.id);
        await db.DeleteData('planning', ids);

        ids = [];
        for (let elem of services)
            ids.push(elem.id);
        await db.DeleteData('services', ids);

        ids = [];
        for (let elem of rooms)
            ids.push(elem.id);
        await db.DeleteData('rooms', ids);

        ids = [];
        for (let elem of roomsTypes)
            ids.push(elem.id);
        await db.DeleteData('rooms_types', ids);

        ids = [];
        for (let elem of inventory)
            ids.push(elem.id);
        await db.DeleteData('inventory', ids);

        ids = [];
        for (let elem of inventoryTypes)
            ids.push(elem.id);
        await db.DeleteData('inventory_types', ids);

        ids = [];
        for (let elem of patients)
            ids.push(elem.id);
        await db.DeleteData('patients', ids);

        await db.disconnect();
    });
});*/
