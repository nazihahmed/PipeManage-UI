const AWS = require('aws-sdk');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const bodyParser = require('body-parser');
const awsIot = require('aws-iot-device-sdk');
const cors = require('cors');
const redis = require('socket.io-redis');

AWS.config.loadFromPath('./aws.json');

app.use(bodyParser.urlencoded({extended:false}));
app.use(cors());

app.use(
  "/static",
  express.static(__dirname + "/dist/static")
);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/dist/index.html');
});

const port = 3000;

const server = app.listen(port, function () {
    console.log('Server running at http://127.0.0.1:' + port + '/');
});

const io = require('socket.io').listen(server);

if(process.env.REDIS_ENDPOINT) {
  io.adapter(redis({ host: process.env.REDIS_ENDPOINT, port: 6379 }));
}

const certs = {
    keyPath: 'deviceCert.key',
    certPath: 'deviceCertAndCACert.crt',
    caPath: 'root.pem',
    host: `a2s7dpv6qj1qss.iot.us-west-2.amazonaws.com`
};

const thingShadows = awsIot.thingShadow(certs);
const iot = new AWS.Iot({apiVersion: '2015-05-28'});

io.on('connection', socket => {

  iot.listThings({}, (err,data) => {
    console.log("got things", data)
    socket.emit('things', data);
  });
  let thing = '';
  socket.on('getShadow', thingName => {
    console.log("received interest in",thingName)
    if(!thing) {
      thingShadows.register( thingName, {}, function() {
        thing = thingName;
        thingShadows.get(thingName)
      });
    } else {
      thingShadows.get(thingName);
    }
  });

  socket.on('updateShadow', desired => {
    thingShadows.update(thing, {
      state: {
        desired
      }
    });
  });

  thingShadows.on('status',(thingName, stat, clientToken, stateObject) => {
    console.log(`received ${stat} on ${thingName}`);
    if(stat === 'accepted' && stateObject) {
      socket.emit('shadow',stateObject);
    }
  });

  thingShadows.on('delta',(thingName, stateObject) => {
    console.log(`received delta on ${thingName}`)
    socket.emit('shadowUpdated',stateObject);
  });

  thingShadows.on('timeout',(thingName, clientToken) =>
        console.log(`received timeout on ${thingName} with token: ${clientToken}`));

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});
