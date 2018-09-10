const AWS = require('aws-sdk');
const awsIot = require('aws-iot-device-sdk');

const certs = {
    keyPath: 'common/thingSocket/deviceCert.key',
    certPath: 'common/thingSocket/deviceCert.crt',
    caPath: 'common/thingSocket/root.pem',
    host: 'a2s7dpv6qj1qss.iot.us-west-2.amazonaws.com'
};

const thingShadows = awsIot.thingShadow(certs, {
  ignoreDeltas: true,
});

AWS.config.loadFromPath(`common/thingSocket/aws.json`);

let registeredThings = [];
let io;

const subscribeToTopic = (topic, emittingTopic) => {
  thingShadows.subscribe(topic, {}, (err, data) => {
    console.log("got data on topic",topic,data);
  });
};

resolveOrReject = (token, resolve, reject) => {
  if (token === null) {
    console.log("token is null")
    return reject();
  }
  console.log("resolve",token)
  resolve(token);
};

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

const registerInterestInThing = (thingName, fn) => {
  return new Promise(async (resolve,reject) => {
    try {
      let thing = getThingByName(thingName);
      console.log("try to get thing",thing)
      if (!thing) {
        thingShadows.register( thingName, {}, async () => {
          const token = await getShadow(thingName);
          if (token === null) {
            reject();
            return fn(false);
          }
          registeredThings.push({
            thingName,
            token,
            fn,
            tokenVerified: false,
            operation: 'get'
          });
          resolve();
        });
      } else {
        console.log("no thing")
        const token = await getShadow(thingName);
        if (token === null) {
          reject();
          return fn(false);
        }
        thing.token = token;
        thing.tokenVerified = false;
        thing.operation = 'get';
        thing.fn = fn;
        resolve();
      }
    } catch (err) {
      reject();
      fn(false);
    }
  });
};

const updateThingShadow = async (thingName, shadow, fn) => {
  let thing = getThingByName(thingName);
  thing.tokenVerified = false;
  thing.operation = 'update';
  console.log("upadting",thingName);
  thing.token = await updateShadow(thing.thingName, shadow);
  thing.fn = fn;
};

const deleteThingShadow = async (thingName, fn) => {
  let thing = getThingByName(thingName);
  thing.tokenVerified = false;
  thing.operation = 'delete';
  thing.token = await deleteShadow(thing.thingName);
  thing.fn = fn;
};

const iot = new AWS.Iot({apiVersion: '2015-05-28'});
let clients = [];
const initSocket = () => {
  io.on('connection', socket => {
    clients.push(socket);
    socket.on('getThings', fn => {
      iot.listThings({}, (err,data) => {
        if(err) {
          fn(false);
        }
        fn(data);
      });
    })

    socket.on('getThing', (thingName, fn) => {
      iot.describeThing({thingName}, (err,data) => {
        if(err) {
          fn(false);
        }
        fn(data);
      });
    })

    socket.on('updateThing', ({thingName, attributes}, fn) => {
      var params = {
        thingName,
        attributePayload: {
          attributes,
          merge: true
        }
      };
      iot.updateThing(params, function(err, data) {
        if(err) {
          fn(false);
        }
        fn(data);
        io.emit(`thing/${thingName}/update`, data);
      });
    })

    socket.on('getShadow', async (thingName, fn) => {
      console.log(`received interest in ${thingName}`)
      try {
        await registerInterestInThing(thingName, fn);
        console.log("received registration token",registeredThings)
      } catch(err) {
        console.log("couldn't register interst in token",err);
        fn(false);
      }
    });

    socket.on('updateShadow', async ({thingName, shadow}, fn) => {
      try {
        await updateThingShadow(thingName, shadow, fn);
      } catch(err) {
        console.error(err);
        console.log(`error to update ${thingName} shadow`);
        fn(false);
      }
    });

    socket.on('deleteShadow', async (thingName, fn) => {
      try {
        await deleteThingShadow(thingName, fn);
      } catch(err) {
        console.error(err);
        console.log(`failed to delete ${thingName} shadow`);
        fn(false);
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
            io.emit(`things/${thing.thingName}/shadow/delete`);
            thingShadows.unregister(thingName);
            registeredThings = registeredThings.filter(thing => thing.thingName !== thingName);
          }
          if(thing.operation === 'update') {
            io.emit(`things/${thing.thingName}/shadow/update`,stateObject);
          }
          thing.fn(stateObject);
        }
        console.log("failed to get shadow")
        thing.fn(false);
      }
    });

    // respond to update operation
    thingShadows.on('delta',(thingName, stateObject) => {
      let thing = getThingByName(thingName, true);
      console.log("received delta", thingName, stateObject)
      if(thing && stateObject && thing.operation === 'update') {
        thing.tokenVerified = true;
        console.log("emittting to all others", `things/${thing.thingName}/shadow/update`)
        io.emit(`things/${thing.thingName}/shadow/update`,stateObject);
        thing.fn(stateObject);
      }
    });

    // any change due to someone else changing it from the outside
    thingShadows.on('foreignStateChange', (thingName, operation, stateObject) => {
      console.log('------------foreignSTATECHANGE');
      io.emit(`things/${thingName}/shadow/${operation}`,stateObject);
    });


    thingShadows.on('timeout',(thingName, clientToken) => {
      let thing = getThingByToken(clientToken, true);
      console.log("received timeout")
      if(thing) {
        thing.tokenVerified = true;
        thing.fn(false);
      }
    });

    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
  });
};

module.exports = server => {
  io = require('socket.io').listen(server);
  initSocket();
}
