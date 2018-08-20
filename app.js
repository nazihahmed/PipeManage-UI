const AWS = require('aws-sdk');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const bodyParser = require('body-parser');
const awsIot = require('aws-iot-device-sdk');
const cors = require('cors');
const redis = require('socket.io-redis');

// AWS.config.region = process.env.REGION
AWS.config.region = 'us-west-2'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'us-west-2:1a2d49ed-f46a-462c-8757-9fafd1635e2c',
});

// const rootCertPath = 'intel-manage-secrets';

var device = awsIot.device({
    keyPath: 'deviceCert.key',
    certPath: 'deviceCertAndCACert.crt',
    caPath: 'root.pem',
    sessionToken: 'us-west-2:1a2d49ed-f46a-462c-8757-9fafd1635e2c',
    clientId: "nazihTest",
    host: `a2s7dpv6qj1qss.iot.us-west-2.amazonaws.com`
});

//
// Device is an instance returned by mqtt.Client(), see mqtt.js for full
// documentation.
//
device
  .on('connect', function() {
    console.log('connect');
    device.subscribe('foo/bar');
    device.publish('foo/bar', JSON.stringify({ message: "Hello from the app"}));
  });

console.log("credentials",AWS.config.credentials)

// var sns = new AWS.SNS();
// var ddb = new AWS.DynamoDB();

// var ddbTable =  process.env.STARTUP_SIGNUP_TABLE;
// var snsTopic =  process.env.NEW_SIGNUP_TOPIC;
app.use(bodyParser.urlencoded({extended:false}));
app.use(cors());

app.use(
  "/static",
  express.static(__dirname + "/dist/static")
);
app.get('/', function(req, res){
  res.sendFile(__dirname + '/dist/index.html');
});


var port = 3000;

var server = app.listen(port, function () {
    console.log('Server running at http://127.0.0.1:' + port + '/');
});
var io = require('socket.io').listen(server);
if(process.env.REDIS_ENDPOINT) {
  io.adapter(redis({ host: process.env.REDIS_ENDPOINT, port: 6379 }));
}
io.on('connection', function(socket){
  console.log('a user connected');
  device
    .on('message', function(topic, payload) {
      console.log('message', topic, payload.toString());
      socket.emit('message', payload.toString())
    });
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  socket.on('chat message', function(msg){
    console.log('message: ' + msg);
  });
});
