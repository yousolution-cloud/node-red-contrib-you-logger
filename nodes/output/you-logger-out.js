const { WriteLog} = require('../../utils/support');
const RED2 = require.main.require('node-red');

module.exports = function(RED) {
    function LoggerOutNode(config) {
        RED.nodes.createNode(this,config);
        let node = this;
        node.on('input', async function(msg) {

            const flow = RED2.nodes.getFlow(node.z);
            const flowname = flow ? flow.label : '';
            msg.flowinfo = {
                nodeid: node.id,
                flowid: node.z,
                flowname
            };
            let conf = RED.nodes.getNode(config.logger).options;

            if(!config.bodyLog || config.bodyLog.trim() === '') {
                node.error("Not Valid Body Props", msg)
                node.status({ fill: 'red', shape: 'dot', text: "Not Valid Body Props" });
            }
            else {
                try {
                    let body = msg[config.bodyLog.trim()];
                    WriteLog(conf, body, node, msg);
                    node.status({ fill: 'green', shape: 'dot', text: 'Write Logs' });
                }
                catch(e) {
                    console.log(e)
                    node.status({ fill: 'red', shape: 'dot', text: e });
                }
            }


           

        });
    }
    RED.nodes.registerType("you-logger-out",LoggerOutNode);
}
