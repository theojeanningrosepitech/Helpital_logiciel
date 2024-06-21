const assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');
const utils = require('../../../utils');
const should = chai.should();
let test;

chai.use(chaiHttp);

describe('api/inventory/types', () => {

    before(async function() {
        test = await utils.Init();
    });

    it('Get inventory types', function(done) {
        chai.request(test.server)
        .get('/api/inventory/types')
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('array');
            res.body.length.should.be.equal(4);
            const data = res.body;

            for (let element of data) {
                for (let type of test.data.inventoryTypes) {
                    if (type.id === element.id) {
                        type.name.should.be.equal(element.name);
                        type.display_name.should.be.equal(element.display_name);
                    }
                }
            }
            done();
        });
    });

    it('Get inventory types from name', function(done) {
        chai.request(test.server)
        .get('/api/inventory/types?search=chirurgical')
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('array');
            res.body.length.should.be.equal(2);
            res.body[0].name.should.be.equal('surgery_tool');
            done();
        });
    });

    it('Update a inventory type', function(done) {
        const newData = {
            display_name: 'Inventory type renamed'
        };

        // update the event
        chai.request(test.server)
        .put('/api/inventory/types?id=' + test.data.inventoryTypes[0].id)
        .set('content-type', 'application/json')
        .send(newData)
        .end((err, res) => {
            res.should.have.status(200);

            // check info
            chai.request(test.server)
            .get('/api/inventory/types?id=' + test.data.inventoryTypes[0].id)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.be.equal(1);

                const data = res.body[0];
                newData.display_name.should.be.equal(data.display_name);
                done();
            });
        });
    });

    it('Delete inventory type', function(done) {
        chai.request(test.server)
        .delete('/api/inventory/types?id=' + test.data.inventoryTypes[0].id)
        .end((err, res) => {
            res.should.have.status(200);

            // check deletion
            chai.request(test.server)
            .get('/api/inventory/types?id=' + test.data.inventoryTypes[0].id)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
                res.body.length.should.be.equal(0);
                done();
            });
        });
    });

    it('Add a inventory type', function(done) {
        let object = {
            display_name: test.data.inventoryTypes[0].display_name
        };

        // add the event
        chai.request(test.server)
        .post('/api/inventory/types')
        .set('content-type', 'application/json')
        .send(object)
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            should.exist(res.body.id);
            res.body.id.should.be.a('number');

            test.data.inventoryTypes[0].id = res.body.id;

            // check info
            chai.request(test.server)
            .get('/api/inventory/types?id=' + test.data.inventoryTypes[0].id)
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
