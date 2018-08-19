// Include the cluster module
var cluster = require('cluster');

// Code to run if we're in the master process
if (cluster.isMaster) {

    // Count the machine's CPUs
    var cpuCount = require('os').cpus().length;

    // Create a worker for each CPU
    for (var i = 0; i < cpuCount; i += 1) {
        cluster.fork();
    }

    // Listen for terminating workers
    cluster.on('exit', function (worker) {

        // Replace the terminated workers
        console.log('Worker ' + worker.id + ' died :(');
        cluster.fork();

    });

// Code to run if we're in a worker process
} else {
    const AWS = require('aws-sdk');
    const express = require('express');
    const bodyParser = require('body-parser');
    const awsIot = require('aws-iot-device-sdk');

    // AWS.config.region = process.env.REGION
    AWS.config.region = 'us-west-2'; // Region
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: 'us-west-2:1a2d49ed-f46a-462c-8757-9fafd1635e2c',
    });

    console.log("credentials",AWS.config.credentials)

    // var sns = new AWS.SNS();
    // var ddb = new AWS.DynamoDB();

    // var ddbTable =  process.env.STARTUP_SIGNUP_TABLE;
    // var snsTopic =  process.env.NEW_SIGNUP_TOPIC;
    var app = express();
    app.use(bodyParser.urlencoded({extended:false}));

    app.use(
      "/",
      express.static("dist")
    );

    var port = process.env.PORT || 8081;

    var server = app.listen(port, function () {
        console.log('Server running at http://127.0.0.1:' + port + '/');
    });
}
