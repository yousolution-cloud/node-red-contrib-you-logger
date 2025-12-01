# @yousolution/node-red-contrib-you-logger

## Description

`@yousolution/node-red-contrib-you-logger` is a Node-RED library based on Winston, enabling advanced log management. It includes features for centralized and configurable log writing and extraction.

## Installation

You can install the package directly via the Node-RED package manager or by using npm:

```bash
npm install @yousolution/node-red-contrib-you-logger
```

## Node Configuration

### Logger Config (`you-logger`)

This configuration node allows you to centralize logging settings. The parameters you can configure are as follows:

- **Name**: The configuration name, used to identify the set of configurations.
- **Dirname**: The path where log files will be saved. By default, logs are saved in the `/data/you-logger/logs` folder.
- **Date Pattern**: The date format that will be used in log file names. The default value is `YYYY-MM-DD`.
- **Zipped Archive**: An option to compress log files. By default, this is enabled (`true`).
- **Max Size**: The maximum size of log files before rotation occurs. The default value is `50m` (50 megabytes).
- **Max Files**: The maximum number of log files to retain before deleting them. The default value is `30d` (30 days).
- **Log Level**: Sets the default log level for recording (`info`, `warn`, `error`, `debug`, etc.).

For more information, see [winstonjs/winston-daily-rotate-file:](https://github.com/winstonjs/winston-daily-rotate-file)

### Logger Input (`you-logger-in`)

The **Logger Input** node allows you to query saved logs using extraction options based on the **winston-daily-rotate-file** library parameters.

- **Main Properties**:
  - **Name**: Node name for identification within the flow.
  - **Logger Config**: Select the `Logger` configuration node containing global settings.
  - **Query**: Specify a query to filter logs using the following parameters supported by Winston:
    - **from**: Start date for the log search.
    - **until**: End date for the log search.
    - **limit**: Maximum number of logs to retrieve.
    - **start**: Offset for starting the search (number of logs to skip).
    - **order**: Log order (ascending or descending).
    - **fields**: Specific fields to include in the results.

When triggered, the node uses these parameters to query saved logs and returns the results as `msg.payload`.

### Logger Output (`you-logger-out`)

The **Logger Output** node is used to write logs, leveraging the power of the **Winston** library with file rotation management provided by **winston-daily-rotate-file**.

#### Node Properties

- **Name**: Node name for identification within the flow.
- **Logger Config**: Select the `Logger` configuration node to define logging settings.
- **Body Log**: Specifies the log content that should be present in the input message (`msg`). This can be a string or object field, and if not provided, the node returns an error.

When triggered, the `Logger Output` node performs the following actions:

1. **Log Writing**:
   
   - The specified property in the input message (`msg`) is transformed into a loggable format. If the message is a string, it is treated as an `info` level. If it’s an object, it can contain the `level` field to specify the log level (e.g., `info`, `warn`, `error`); all expected properties will be included in the log.
   - Logs include additional information such as:
     - `msgId`: The message ID.
     - `flowid`: The flow ID in Node-RED.
     - `flowname`: The Node-RED flow name.
     - `uniqueId`: A generated UUID to uniquely identify the log.
     - `configurationName`: The name of the logger configuration used.

2. **Example Log**:
   
   A written log might appear as follows:
   
   ```json
   {
       "configurationName": "LoggerNodeRed",
       "flowid": "0e361e13e07cca48",
       "flowname": "Test Flow",
       "level": "info",
       "msgId": "7ba49eb2a7fe915f",
       "nodeid": "7f636f4b33cf75cb",
       "timestamp": "2024-10-18 08:02:00",
       "mycustomProps": "My Custom Value",
       "value": "TEST",
       "uniqueId": "dd14ded9-e232-4050-94b1-99fdd9a95ec8"
   }
   ```