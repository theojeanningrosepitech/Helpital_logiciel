process.env.NODE_ENV = 'test';
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;
const utils = require('../../utils');
let test;

describe('/api/pong', () => {
    before(async function() {
        test = await utils.Init();
    });

    it('should GET pong as response', function (done) {
        chai.request(test.server)
            .get('/api/ping')
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                done();
            })
    });

    after(async function() {
        await utils.Clear();
    });
});

after(async function() {
    await utils.Disconnect();
});
