const AWS = require('aws-sdk');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const bodyParser = require('body-parser');
const awsIot = require('aws-iot-device-sdk');
const cors = require('cors');
const redis = require('socket.io-redis');

AWS.config.loadFromPath('./aws.json');
const iot = new AWS.Iot({apiVersion: '2015-05-28'});

const certs = {
    keyPath: 'deviceCert.key',
    certPath: 'deviceCertAndCACert.crt',
    caPath: 'root.pem',
    host: `a2s7dpv6qj1qss.iot.us-west-2.amazonaws.com`
};

var device = awsIot.device(certs);
// var thingShadows = awsIot.thingShadow(certs);

// thingShadows.on('connect', function() {
// //
// // After connecting to the AWS IoT platform, register interest in the
// // Thing Shadow named 'RGBLedLamp'.
// //
//     thingShadows.register( 'nazihTestName', {}, function() {
//
// // Once registration is complete, update the Thing Shadow named
// // 'RGBLedLamp' with the latest device state and save the clientToken
// // so that we can correlate it with status or timeout events.
// //
// // Thing shadow state
// //
//        var rgbLedLampState = {"state":{"desired":{"red":rval,"green":gval,"blue":bval}}};
//
//        clientTokenUpdate = thingShadows.update('nazihTestName', rgbLedLampState  );
// //
// // The update method returns a clientToken; if non-null, this value will
// // be sent in a 'status' event when the operation completes, allowing you
// // to know whether or not the update was successful.  If the update method
// // returns null, it's because another operation is currently in progress and
// // you'll need to wait until it completes (or times out) before updating the
// // shadow.
// //
//        if (clientTokenUpdate === null)
//        {
//           console.log('update shadow failed, operation still in progress');
//        }
//     });
// });
// thingShadows.on('status',
//     function(thingName, stat, clientToken, stateObject) {
//        console.log('received '+stat+' on '+thingName+': '+
//                    JSON.stringify(stateObject));
// //
// // These events report the status of update(), get(), and delete()
// // calls.  The clientToken value associated with the event will have
// // the same value which was returned in an earlier call to get(),
// // update(), or delete().  Use status events to keep track of the
// // status of shadow operations.
// //
//     });
//
// thingShadows.on('delta',
//     function(thingName, stateObject) {
//        console.log('received delta on '+thingName+': '+
//                    JSON.stringify(stateObject));
//     });
//
// thingShadows.on('timeout',
//     function(thingName, clientToken) {
//        console.log('received timeout on '+thingName+
//                    ' with token: '+ clientToken);
//
// In the event that a shadow operation times out, you'll receive
// one of these events.  The clientToken value associated with the
// event will have the same value which was returned in an earlier
// call to get(), update(), or delete().
//
    // });


// device
//   .on('connect', function() {
//     console.log('connected to');
//     // device.publish('test', JSON.stringify({ message: "Hello from the app"}));
//   });

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

io.on('connection', socket => {
  console.log('a user connected');
  socket.emit('testing2', 'hello');
  // device.subscribe('test');
  iot.listThings({}, (err,data) => {
    console.log("got things", data)
    socket.emit('testing', data);
  })

  // device
  //   .on('message', (topic, payload) => {
  //     console.log('message', topic, payload.toString());
  //     // socket.emit(topic, payload.toString())
  //   });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});
