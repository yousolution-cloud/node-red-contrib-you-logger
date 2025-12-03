const winston = require('winston');
const { createLogger, format, transports } = winston;
const DailyRotateFile = require('winston-daily-rotate-file');
const { v4 } = require('uuid');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const readline = require('readline');



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
        fields,
        filter={}, 
    } = query;

    const options = {
        from: from,
        until: until,
        limit: limit,
        start: start,
        order: order,
        fields: fields,
        //filter: filter,
        json: true 
      };

    let logsRes = []
    if(Object.keys(filter).length > 0){
        let filteredLogs = [];
        let auditFile = getFileAudit(conf);
        if(auditFile) {
            files = auditFile.files;
            let filesToRead = files
            if (filesToRead.length === 0) {
                return { dailyRotateFile: [] };
            }

            // Ordina i file per data
            if (order === 'asc') {
                filesToRead.sort();
            } else {
                filesToRead.sort().reverse();
            }

            for (let fileName of filesToRead) {
                if (filteredLogs.length >= limit) break;

                const filePath = fileName.name;
                if (!fs.existsSync(filePath)) {
                    console.warn(`[ATTENZIONE] Il file ${filePath} elencato nell'audit non esiste più. Salto.`);
                    continue;
                }
                let fileStream = fs.createReadStream(filePath);
                let isGzipped = path.extname(filePath) === '.gz';
                let streamToProcess = isGzipped ? fileStream.pipe(zlib.createGunzip()) : fileStream;
                let rl = readline.createInterface({ input: streamToProcess, crlfDelay: Infinity });
                for await (let line of rl) {
                    if (line.trim() === '') continue;
        
                    try {
                        const logEntry = JSON.parse(line);
                        if (Object.entries(filter).every(([key, value]) => logEntry[key] === value)) {
                            filteredLogs.push(logEntry);
                        }
                    } 
                    catch (e) {
                            // Ignora righe non JSON
                    }
                }

                rl.close();
                streamToProcess.destroy();
                fileStream.close();
            }
            if (order === 'desc') {
                filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            } else {
                filteredLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            }
            return { dailyRotateFile: filteredLogs.slice(0, limit) };
        }
        else {
            return { dailyRotateFile: [] };
        }
    }
    else {
        logsRes = await new Promise((resolve, reject) => {
        logger.query(options, (err, results) => {
            if (err) {
                node.error(err, msg); 
                return reject(err); 
            }
            resolve(results); 
            });
        });
        return logsRes;
    };

      


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



function getFileAudit(conf) {
    const auditFilePath = path.join(conf.dirname, `${conf.name}-audit.json`);
    if (fs.existsSync(auditFilePath)) {
        const auditData = fs.readFileSync(auditFilePath, 'utf8');
        return JSON.parse(auditData);
    } else {
        return null;
    };
}



module.exports = {
    WriteLog: WriteLog,
    GetLogs: GetLogs
};