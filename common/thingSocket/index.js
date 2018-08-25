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

const iot = new AWS.Iot({apiVersion: '2015-05-28'});

const initSocket = () => {
  io.on('connection', socket => {
    socket.on('getThings', () => {
      iot.listThings({}, (err,data) => {
        if(err) {
          return socket.emit('things/error');
        }
        socket.emit('things', data);
      });
    })

    socket.on('getThing', (thingName) => {
      iot.describeThing({thingName}, (err,data) => {
        if(err) {
          return socket.emit(`thing/${thingName}/error`);
        }
        socket.emit(`thing/${thingName}`, data);
      });
    })

    socket.on('updateThingAlias', ({thingName, newThingAlias}) => {
      var params = {
        thingName: thingName, /* required */
        attributePayload: {
          attributes: {
            'alias': newThingAlias,
          },
          merge: true
        },
        // expectedVersion: 0
      };
      iot.updateThing(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log("success",data);           // successful response
      });
    })

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
};

module.exports = server => {
  io = require('socket.io').listen(server);
  initSocket();
}
