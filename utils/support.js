const winston = require('winston');
const { createLogger, format, transports } = winston;
const DailyRotateFile = require('winston-daily-rotate-file');
const { v4 } = require('uuid');
const { promisify } = require('util');



async function GetLogs(conf, query, node, msg) {
    let logger = createLogger({
        level: conf.level,
        format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.json(),
        ),
        transports: [
            new DailyRotateFile({
                filename: `${conf.name}-%DATE%.log`,
                dirname: conf.dirname,
                datePattern: conf.datePattern,
                zippedArchive: conf.zippedArchive ,
                maxSize: conf.maxSize, // Dimensione massima del file di log
                maxFiles: conf.maxFiles, // Numero massimo di file da mantenere
                auditFile: `${conf.dirname}/${conf.name}-audit.json`,
                json: true,
            })
        ]
    });

    let {
        from=new Date(Date.now() - (24 * 60 * 60 * 1000)), 
        until=new Date(), 
        limit=100, 
        start=0, 
        order="asc", 
        fields 
    } = query;

    const options = {
        from: from,
        until: until,
        limit: limit,
        start: start,
        order: order,
        fields: fields,
        json: true 
      };

       const logsRes = await new Promise((resolve, reject) => {
        logger.query(options, (err, results) => {
            if (err) {
                node.error(err, msg); 
                return reject(err); 
            }
            console.log(results);
            resolve(results); 
        });
    });

    return logsRes; 



}

function WriteLog(conf, raw_message, node, msg) {
    
    let message =  formatMessage(raw_message);

    let logger = createLogger({
        level: conf.level,
        format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.json(),
        ),
        transports: [
            new DailyRotateFile({
                filename: `${conf.name}-%DATE%.log`,
                dirname: conf.dirname,
                datePattern: conf.datePattern,
                zippedArchive: conf.zippedArchive ,
                maxSize: conf.maxSize, // Dimensione massima del file di log
                maxFiles: conf.maxFiles, // Numero massimo di file da mantenere
                auditFile: `${conf.dirname}/${conf.name}-audit.json`,
                json: true,
            })
        ]
    });

    try {
        logger.log({
            ...message,
            msgId: msg._msgid,
            ...msg.flowinfo,
            configurationName: conf.name,
            uniqueId: v4(),
          });
    }
    catch (e) {
        node.error(e);
    }
}


function formatMessage(input) {
    // Se l'input è una stringa, creiamo un oggetto con "info" come livello predefinito
    if (typeof input === 'string') {
      return {
        level: 'info', // Valore predefinito
        value: input   // Il messaggio passato
      };
    }
    if(typeof input === 'object') {

        if(!input.hasOwnProperty('level')){
            input.level = 'info'
        }

        return {
            ...input
        };
    }
    else{
        return {
            level: 'info', 
            value: input.toString()  
          };
    }

  
  }


module.exports = {
    WriteLog: WriteLog,
    GetLogs: GetLogs,
};