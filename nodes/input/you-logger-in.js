const { GetLogs } = require('../../utils/support');
module.exports = function(RED) {
    function LoggerInNode(config) {
        RED.nodes.createNode(this,config);
        let node = this;
        node.on('input', async function(msg) {
            let conf = RED.nodes.getNode(config.logger).options;
            if(!config.query || config.query.trim() === '') {
                node.error("Not Valid Query", msg)
                node.status({ fill: 'red', shape: 'dot', text: "Not Valid Query" });
            }
            else {
                try {
                    let query = msg[config.query.trim()];
                    let logs = await GetLogs(conf, query, node, msg);
                    msg.payload = logs.dailyRotateFile;
                    node.status({ fill: 'green', shape: 'dot', text: 'Get Logs' });
                    node.send(msg);
                }
                catch(e) {
                    node.status({ fill: 'red', shape: 'dot', text: e });
                    node.error(JSON.stringify(e), msg);
                }
            }
        });
    }
    RED.nodes.registerType("you-logger-in",LoggerInNode);
}
