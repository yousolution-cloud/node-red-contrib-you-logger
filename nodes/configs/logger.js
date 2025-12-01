module.exports = function (RED)  {
    function LoggerConfigsNode(n) {
        RED.nodes.createNode(this, n);
        this.options = {
            name : n.name || n.id,
            dirname : n.dirname || "/data/you-logger/logs",
            datePattern : n.datePattern || 'YYYY-MM-DD',
            zippedArchive: n.zippedArchive || "true", 
            maxSize: n.maxSize || "50m",
            maxFiles: n.maxFiles || "30d",
            level: n.level,
        }
    }

    RED.nodes.registerType('you-logger', LoggerConfigsNode);
}
