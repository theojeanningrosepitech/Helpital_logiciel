const assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');
const utils = require('../../../utils');
const should = chai.should();
let test;

chai.use(chaiHttp);

describe('api/rooms/rooms', () => {

    before(async function() {
        test = await utils.Init();
    });

    it('Get rooms', function(done) {
        chai.request(test.server)
        .get('/api/rooms')
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('array');
            res.body.length.should.be.equal(66);
            const data = res.body;

            for (let element of data) {
                for (let room of test.data.rooms) {
                    if (room.id === element.id) {
                        room.title.should.be.equal(element.title);
                        room.floor.should.be.equal(element.floor);
                        room.service_id.should.be.equal(element.service_id);
                    }
                }
            }

            data[0].title.should.be.equal('101');
            data[0].type.display_name.should.be.equal('Chambre');
            data[0].supervisor.login.should.be.equal('bryanice');

            data[0].patients.length.should.be.equal(2);
            data[0].patients[0].firstname.should.be.equal('Alize');

            data[0].inventory.length.should.be.equal(0);
            done();
        });
    });

    it('Get rooms from service_id', function(done) {
        chai.request(test.server)
        .get('/api/rooms?service_id=4')
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('array');
            res.body.length.should.be.equal(53);
            done();
        });
    });

    it('Get rooms from title', function(done) {
        chai.request(test.server)
        .get('/api/rooms?title=R2')
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('array');
            res.body.length.should.be.equal(1);
            done();
        });
    });

    it('Update a room', function(done) {
        const newData = {
            title: 'Room renamed',
            type: 3
        };

        // update the event
        chai.request(test.server)
        .put('/api/rooms?id=' + test.data.rooms[4].id)
        .set('content-type', 'application/json')
        .send(newData)
        .end((err, res) => {
            res.should.have.status(200);

            // check info
            chai.request(test.server)
            .get('/api/rooms?id=' + test.data.rooms[4].id)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.be.equal(1);

                const data = res.body[0];
                newData.title.should.be.equal(data.title);
                done();
            });
        });
    });

    it('Delete room', function(done) {
        chai.request(test.server)
        .delete('/api/rooms?id=' + test.data.rooms[4].id)
        .end((err, res) => {
            res.should.have.status(200);

            // check deletion
            chai.request(test.server)
            .get('/api/rooms?id=' + test.data.rooms[4].id)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.be.equal(0);
                done();
            });
        });
    });

    it('Add a room', function(done) {
        let object = Object.assign({}, test.data.rooms[4]);
        delete object.id;

        // add the event
        chai.request(test.server)
        .post('/api/rooms')
        .set('content-type', 'application/json')
        .send(object)
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            should.exist(res.body.id);
            res.body.id.should.be.a('number');

            test.data.rooms[4].id = res.body.id;

            // check info
            chai.request(test.server)
            .get('/api/rooms?id=' + test.data.rooms[4].id)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.be.equal(1);
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
