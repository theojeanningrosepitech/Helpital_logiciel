process.env.NODE_ENV = 'test';
const server = require('../app');
const db = require('../server/database');

// insert test data in database
async function Init() {
    await new Promise(async (resolve) => {
        const testDataKeys = Object.keys(testData);
        const lastTableName = testDataKeys[testDataKeys.length - 1];
        let tablesCount = 0;

        for (const tableName of testDataKeys) {
            await testData[tableName].forEach(async function(object, key) {
                const result = await db.InsertData(getSnakeCase(tableName), object);

                if (result.err) {
                    console.log(result.err);
                    return;
                }
                testData[tableName][key].id = result.data;

                // wait for the last request to respond before resolving the promise, and exit this async function
                if (tableName === lastTableName) {
                    tablesCount++;

                    if (tablesCount === testData[tableName].length)
                        resolve();
                }
            });
        }
    });

    return {
        server: server,
        data: testData,
    };
}

async function InitWithoutDB() {
    return {
        server: server,
        data: testData,
    };
}

// delete test data and disconnect database
async function Clear() {
    let ids;

    for (const tableName in testData) {
        ids = [];

        for (let elem of testData[tableName])
            ids.push(elem.id);
        await db.DeleteData(getSnakeCase(tableName), ids);
    }
}

async function Disconnect() {
    await db.disconnect();
}

// convert a camelCase variable name to a snake_case variable name
// 'tableName' --> 'table_name'
function getSnakeCase(str) {
    let newStr = '';

    for (const c of str) {
        if (c >= 'A' && c <= 'Z') {
            newStr += '_';
            newStr += String.fromCharCode(c.charCodeAt(0) + 32);
        } else {
            newStr += c;
        }
    }

    return newStr;
}

// declare data that will be used in tests
const testData = {
    planning: [{
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
    }],

    services: [
        { title: 'Radiologie' },
        { title: 'Cardiologie' },
        { title: 'Pédiatrie' },
        { title: 'Pneumologie' },
        { title: 'Neurologie' },
        { title: 'Cancerologie' },
        { title: 'Néphrologie' },
        { title: 'Psychologie' },
        { title: 'Soins palliatifs' }
    ],

    rooms: [{
        title: 'Bloc opératoire',
        type: 3,
        service_id: 2,
        floor: -1,
        capacity: 2,
        corners: '-5,-8;5,-8;5,5;-5,5',
        position_x: 0,
        position_y: 0,
        supervisor: 2
    }, {
        title: 'Cagibi',
        type: 1,
        service_id: 4,
        floor: 1,
        capacity: 0,
        corners: '-5,-3;-2,-3;-2,-1;-5,-1',
        position_x: 0,
        position_y: 0,
        supervisor: 2
    }, {
        title: 'R1',
        type: 2,
        service_id: 1,
        floor: 1,
        capacity: 1,
        corners: '-3,-3;0,-3;0,-1;-3,-1',
        position_x: 0,
        position_y: 0,
        supervisor: 2
    }, {
        title: 'R2',
        type: 2,
        service_id: 4,
        floor: 1,
        capacity: 1,
        corners: '-3,1;0,1;0,5;-3,5',
        position_x: 0,
        position_y: 0,
        supervisor: 2
    }, {
        title: 'R3',
        type: 2,
        capacity: 1,
        service_id: 4,
        floor: 1,
        corners: '0,-5;3,-5;3,-1;0,-1',
        position_x: 0,
        position_y: 0,
        supervisor: 2
    }, {
        title: 'A1',
        type: 2,
        service_id: 6,
        floor: 2,
        capacity: 1,
        corners: '-3,-5;0,-5;0,-1;-3,-1',
        position_x: 0,
        position_y: 0,
        supervisor: 2
    }, {
        title: 'A2',
        type: 2,
        service_id: 6,
        floor: 2,
        capacity: 1,
        corners: '-3,1;0,1;0,5;-3,5',
        position_x: 0,
        position_y: 0,
        supervisor: 2
    }],

    roomsTypes: [{
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
    }],

    patients: [{
        firstname: 'Axel',
        lastname: 'Bertin',
        birthdate: '2000-07-19 12:00:00',
        ss_number: '0123456789024',
        height: 1.73,
        weight: 70.3,
        age: 54,
        imc: 23,
        blood_type: 'A',
        gender: 'M',
        allergies: '',
        room_id: 1,
        service_id: 11,
        visit_number: 26353,
        is_hospitalized: true,
        doctor_id: 21,
    }, {
        firstname: 'Alize',
        lastname: 'Charles',
        birthdate: '1999-02-21 12:00:00',
        ss_number: '0123456789025',
        height: 1.73,
        weight: 70.3,
        age: 54,
        imc: 23,
        blood_type: 'A',
        gender: 'M',
        allergies: '',
        room_id: 4,
        service_id: 11,
        visit_number: 26353,
        is_hospitalized: true,
        doctor_id: 21,
    }, {
        firstname: 'Audrey',
        lastname: 'Noel',
        birthdate: '1995-11-12 12:00:00',
        ss_number: '0123456789026',
        height: 1.73,
        weight: 70.3,
        age: 54,
        imc: 23,
        blood_type: 'A',
        gender: 'M',
        allergies: '',
        room_id: 1,
        service_id: 11,
        visit_number: 26353,
        is_hospitalized: true,
        doctor_id: 21,
    }, {
        firstname: 'Emma',
        lastname: 'Gaillard',
        birthdate: '1997-05-02 12:00:00',
        ss_number: '0123456789027',
        height: 1.73,
        weight: 70.3,
        age: 54,
        imc: 23,
        blood_type: 'A',
        gender: 'M',
        allergies: '',
        room_id: 1,
        service_id: 11,
        visit_number: 26353,
        is_hospitalized: true,
        doctor_id: 21,
    }, {
        firstname: 'Lucas',
        lastname: 'Roy',
        birthdate: '1974-07-04 12:00:00',
        ss_number: '0123456789028',
        height: 1.73,
        weight: 70.3,
        age: 54,
        imc: 23,
        blood_type: 'A',
        gender: 'M',
        allergies: '',
        room_id: 1,
        service_id: 11,
        visit_number: 26353,
        is_hospitalized: true,
        doctor_id: 21,
    }, {
        firstname: 'Lucas',
        lastname: 'Leroux',
        birthdate: '1985-08-06 12:00:00',
        ss_number: '0123456789029',
        height: 1.73,
        weight: 70.3,
        age: 54,
        imc: 23,
        blood_type: 'A',
        gender: 'M',
        allergies: '',
        room_id: 2,
        service_id: 11,
        visit_number: 26353,
        is_hospitalized: true,
        doctor_id: 21,
    }],

    inventoryTypes: [
    {
        name: 'surgery_tool',
        display_name: 'Outil chirurgical'
    },
    {
        name: 'medical_device',
        display_name: 'Appareil médical'
    }],

    inventory: [{
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
    }],

    /*conversation: [{
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
    }]*/
};

module.exports = {
    Init: Init,
    InitWithoutDB: InitWithoutDB,
    Clear: Clear,
    Disconnect: Disconnect,
}
