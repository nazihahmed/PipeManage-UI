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

const thingShadows = awsIot.thingShadow(certs, {
  ignoreDeltas: true,
});
const iot = new AWS.Iot({apiVersion: '2015-05-28'});

const subscribeToTopic = (topic, emittingTopic) => {
  thingShadows.subscribe(topic, {}, (err, data) => {
    console.log("got data on topic",topic,data);
  });
}

const getShadow = thingName => {
  return new Promise((resolve, reject) => {
    let clientTokenUpdate = thingShadows.get(thingName);
    if (clientTokenUpdate === null) {
      reject();
    }
    resolve(clientTokenUpdate);
  })
};

const updateShadow = (thingName, shadow) => {
  return new Promise((resolve, reject) => {
    let clientTokenUpdate = thingShadows.update(thingName, shadow);
    console.log("updating shadow",thingName, shadow, clientTokenUpdate)
    if (clientTokenUpdate === null) {
      reject();
    }
    resolve(clientTokenUpdate);
  })
};

let registeredThings = [];

const registerInterestInThing = (thingName) => {
  return new Promise(async (resolve,reject) => {
    try {
      if (!registeredThings.find(thing => thing.thingName === thingName)) {
        thingShadows.register( thingName, {}, async () => {
          const token = await getShadow(thingName);
          if (token === null) {
            reject();
          }
          registeredThings.push({ thingName, token, tokenVerified: false, get: true });
          resolve();
        });
      } else {
        const token = await getShadow(thingName);
        if (token === null) {
          reject();
        }
        let thing = registeredThings.find(thing => thing.thingName === thingName);
        thing.token = token;
        thing.tokenVerified = false;
        thing.get = true;
        resolve();
      }
    } catch (err) {
      reject();
    }
  });
};

const updateThingShadow = async (thingName, desired) => {
  let thing = registeredThings.find(thing => thing.thingName === thingName);
  thing.tokenVerified = false;
  thing.get = false;
  const token = await updateShadow(thing.thingName, {
    state: {
      desired
    }
  });
  thing.token = token;
}

io.on('connection', socket => {

  iot.listThings({}, (err,data) => {
    console.log("got things", data)
    socket.emit('things', data);
  });

  socket.on('getShadow', async (thingName) => {
    console.log(`received interest in ${thingName}`)
    try {
      await registerInterestInThing(thingName);
      console.log("received registration token",registeredThings)
    } catch(err) {
      console.log("couldn't register interst in token",err);
    }
  });

  socket.on('updateShadow', async ({thingName, desired}) => {
    console.log(`received update to ${thingName}`)
    try {
      await updateThingShadow(thingName, desired);
      console.log("received registration token",registeredThings)
    } catch(err) {
      console.error(err);
      console.log(`failed to update ${thingName} state`);
    }
  });

  thingShadows.on('status',(thingName, stat, clientToken, stateObject) => {
    console.log(`received ${stat} on ${thingName} token ${clientToken}`,stateObject);
    let thing = registeredThings.find(thing => (thing.token === clientToken) && !thing.tokenVerified);
    if(stat === 'accepted' && thing && stateObject && thing.get) {
      thing.tokenVerified = true;
      socket.emit(`things/${thing.thingName}/shadow/get`,stateObject);
      console.log("got shadow back",`things/${thing.thingName}/shadow/get`,stateObject)
    }
  });

  thingShadows.on('delta',(thingName, stateObject) => {
    console.log(`received delta on ${thingName}`,stateObject)
    let thing = registeredThings.find(thing => (thing.thingName === thingName) && !thing.tokenVerified);
    if(thing && stateObject && !thing.get) {
      thing.tokenVerified = true;
      socket.emit(`things/${thing.thingName}/shadow/update`,stateObject);
      console.log("got shadow updated",stateObject)
    }
  });

  thingShadows.on('timeout',(thingName, clientToken) =>
        console.log(`received timeout on ${thingName} with token: ${clientToken}`));

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});
