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
    certPath: 'deviceCert.crt',
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

const resolveOrReject = (token, resolve, reject) => {
  if (token === null) {
    console.log("token is null")
    return reject();
  }
  console.log("resolve",token)
  resolve(token);
};

let registeredThings = [];

const getShadow = thingName => {
  return new Promise((resolve, reject) => {
    resolveOrReject(thingShadows.get(thingName), resolve, reject);
  })
};

const deleteShadow = thingName => {
  return new Promise((resolve, reject) => {
    resolveOrReject(thingShadows.delete(thingName), resolve, reject);
  })
};

const updateShadow = (thingName, shadow) => {
  return new Promise((resolve, reject) => {
    resolveOrReject(thingShadows.update(thingName, shadow), resolve, reject);
  })
};

const tokenNotVerfiedFilter = (things, tokenNotVerified) => {
  if (tokenNotVerified) return things.find(thing => !thing.tokenVerified)
  return things[0];
};

const getThingByToken = (token, tokenNotVerified) => {
  const things = registeredThings.filter(thing => thing.token === token);
  return tokenNotVerfiedFilter(things, tokenNotVerified);
};

const getThingByName = (name, tokenNotVerified) => {
  const things = registeredThings.filter(thing => thing.thingName === name);
  console.log("filtered things",things)
  return tokenNotVerfiedFilter(things, tokenNotVerified);
};

const registerInterestInThing = (thingName) => {
  return new Promise(async (resolve,reject) => {
    try {
      let thing = getThingByName(thingName);
      if (!thing) {
        thingShadows.register( thingName, {}, async () => {
          const token = await getShadow(thingName);
          if (token === null) {
            reject();
          }
          registeredThings.push({
            thingName,
            token,
            tokenVerified: false,
            operation: 'get'
          });
          resolve();
        });
      } else {
        const token = await getShadow(thingName);
        if (token === null) {
          reject();
        }
        thing.token = token;
        thing.tokenVerified = false;
        thing.operation = 'get';
        resolve();
      }
    } catch (err) {
      reject();
    }
  });
};

const updateThingShadow = async (thingName, shadow) => {
  let thing = getThingByName(thingName);
  thing.tokenVerified = false;
  thing.operation = 'update';
  console.log("upadting",thingName)
  thing.token = await updateShadow(thing.thingName, shadow);
};

const deleteThingShadow = async (thingName) => {
  let thing = getThingByName(thingName);
  thing.tokenVerified = false;
  thing.operation = 'delete';
  thing.token = await deleteShadow(thing.thingName);
};

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
      io.emit(`things/${thingName}/shadow/get/error`);
    }
  });

  socket.on('updateShadow', async ({thingName, shadow}) => {
    try {
      await updateThingShadow(thingName, shadow);
    } catch(err) {
      console.error(err);
      console.log(`error to update ${thingName} shadow`);
      io.emit(`things/${thingName}/shadow/update/error`);
    }
  });

  socket.on('deleteShadow', async (thingName) => {
    try {
      await deleteThingShadow(thingName);
    } catch(err) {
      console.error(err);
      console.log(`error to delete ${thingName} shadow`);
      io.emit(`things/${thingName}/shadow/delete/error`);
    }
  });

  // respond to getting the shadow
  thingShadows.on('status',(thingName, stat, clientToken, stateObject) => {
    let thing = getThingByToken(clientToken, true);
    console.log("received status",thingName, stat, clientToken)
    if(thing && stateObject) {
      thing.tokenVerified = true;
      if(stat === 'accepted') {
        if (thing.operation === 'delete') {
          thingShadows.unregister(thingName);
          registeredThings = registeredThings.filter(thing => thing.thingName !== thingName);
        }
        return io.emit(`things/${thing.thingName}/shadow/${thing.operation}`,stateObject);
      }
      console.log("failed to get shadow")
      io.emit(`things/${thing.thingName}/shadow/${thing.operation}/error`);
    }
  });

  // respond to update operation
  thingShadows.on('delta',(thingName, stateObject) => {
    let thing = getThingByName(thingName, true);
    console.log("received delta", thingName, stateObject)
    if(thing && stateObject && thing.operation === 'update') {
      thing.tokenVerified = true;
      io.emit(`things/${thing.thingName}/shadow/update`,stateObject);
    }
  });

  // any change due to someone else changing it from the outside
  thingShadows.on('foreignStateChange', (thingName, operation, stateObject) => {
    io.emit(`things/${thingName}/shadow/${operation}`,stateObject);
  });


  thingShadows.on('timeout',(thingName, clientToken) => {
    let thing = getThingByToken(clientToken, true);
    console.log("received timeout")
    if(thing) {
      thing.tokenVerified = true;
      console.log(`things/${thingName}/shadow/${thing.operation}/error`);
      io.emit(`things/${thingName}/shadow/${thing.operation}/error`);
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});
