const assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');
const utils = require('../../../utils');
const should = chai.should();
let test;

chai.use(chaiHttp);

describe('api/patients/patients', () => {

    before(async function() {
        test = await utils.Init();
    });

    it('Get patients', function(done) {
        chai.request(test.server)
        .get('/api/patients')
        .end((err, res) => {
            res.should.have.status(200);
            const data = res.body.patients;

            data.should.be.a('array');
            data.length.should.be.equal(18);

            for (let element of data) {
                for (let patient of test.data.patients) {
                    if (patient.id === element.id) {
                        patient.firstname.should.be.equal(element.firstname);
                        patient.lastname.should.be.equal(element.lastname);
                        patient.ss_number.should.be.equal(element.ss_number);

                        if (element.room) {
                            element.room.id.should.be.equal(patient.room_id);
                        } else if (patient.room_id) {
                            patient.room_id.should.be.equal(0);
                        }
                    }
                }
            }
            done();
        });
    });

    it('Get patients from name', function(done) {
        chai.request(test.server)
        .get('/api/patients?search=Axel')
        .end((err, res) => {
            res.should.have.status(200);
            const data = res.body.patients;

            data.should.be.a('array');
            data.length.should.be.equal(2);

            test.data.patients[0].firstname.should.be.equal(data[0].firstname);
            test.data.patients[0].lastname.should.be.equal(data[0].lastname);
            done();
        });
    });

    it('Update a patient', function(done) {
        const newData = {
            firstname: 'Greg',
            room_id: 4
        };

        // update the event
        chai.request(test.server)
        .put('/api/patients?id=' + test.data.patients[0].id)
        .set('content-type', 'application/json')
        .send(newData)
        .end((err, res) => {
            res.should.have.status(200);

            // check info
            chai.request(test.server)
            .get('/api/patients?id=' + test.data.patients[0].id)
            .end((err, res) => {
                res.should.have.status(200);
                const data = res.body.patients;

                data.should.be.a('array');
                data.length.should.be.equal(1);
                newData.firstname.should.be.equal(data[0].firstname);
                newData.room_id.should.be.equal(data[0].room.id);
                done();
            });
        });
    });

    it('Delete a patient', function(done) {
        chai.request(test.server)
        .delete('/api/patients?id=' + test.data.patients[0].id)
        .end((err, res) => {
            res.should.have.status(200);

            // check deletion
            chai.request(test.server)
            .get('/api/patients?id=' + test.data.patients[0].id)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.patients.should.be.a('array');
                res.body.patients.length.should.be.equal(0);
                done();
            });
        });
    });

    it('Add a patient', function(done) {
        let object = Object.assign({}, test.data.patients[0]);
        delete object.id;

        // add the event
        chai.request(test.server)
        .post('/api/patients')
        .set('content-type', 'application/json')
        .send(object)
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            should.exist(res.body.id);
            res.body.id.should.be.a('number');
            test.data.patients[0].id = res.body.id;

            // check info
            chai.request(test.server)
            .get('/api/patients?id=' + test.data.patients[0].id)
            .end((err, res) => {
                res.should.have.status(200);
                const data = res.body.patients;

                data.should.be.a('array');
                data.length.should.be.equal(1);
                done();
            });
        });
    });

    after(async function() {
        await utils.Clear();
    });
});

after(async function() {
    await utils.Disconnect();
});
