const sinon = require('sinon');
const { WriteLog, GetLogs } = require('../utils/support');
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

let chai, expect;
before(async () => {
  chai = await import('chai');
  expect = chai.expect;
});

describe('Logging Functions', () => {
    let conf, node, msg;

    beforeEach(() => {
        conf = {
            level: 'info',
            name: 'test-log',
            dirname: './logs',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: false,
            maxSize: '20m',
            maxFiles: '1d',
        };

        node = {
            log: sinon.spy(),
            warn: sinon.spy(),
            error: sinon.spy(),
        };

        msg = {
            _msgid: '12345',
            flowinfo: {
                flowId: 'flow1',
            },
        };
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should write a log entry correctly', () => {
        const raw_message = 'This is a test log message';
        
        // Stubbiamo il transport per controllare se è chiamato correttamente
        const transportStub = sinon.stub(DailyRotateFile.prototype, 'log');
        
        WriteLog(conf, raw_message, node, msg);

        // Verifica che il logger di DailyRotateFile sia stato chiamato
        expect(transportStub.called).to.be.true;

        // Controlla che i parametri passati al logger siano corretti
        const args = transportStub.args[0][0];
        expect(args.value).to.equal('This is a test log message');
        expect(args.level).to.equal('info');
    });

    it('should format the log entry correctly when object is passed', () => {
        const raw_message = {
            level: 'error',
            value: 'Test error log',
        };

        const transportStub = sinon.stub(DailyRotateFile.prototype, 'log');

        WriteLog(conf, raw_message, node, msg);

        expect(transportStub.called).to.be.true;

        const args = transportStub.args[0][0];
        expect(args.value).to.equal('Test error log');
        expect(args.level).to.equal('error');
    });

    it('should handle errors when retrieving logs', async () => {
        const query = {
            from: new Date(Date.now() - 24 * 60 * 60 * 1000),
            until: new Date(),
            limit: 10,
            start: 0,
            order: 'asc',
        };

        const loggerStub = sinon.stub(winston, 'createLogger').returns({
            query: sinon.stub().yields(new Error('Log retrieval error'), null),
        });

        try {
            await GetLogs(conf, query, node, msg);
        } catch (err) {
            expect(err.message).to.equal('Log retrieval error');
        }
        loggerStub.restore();
    });
});
