import io from 'socket.io-client';

const { hostname } = window.location;
const port = hostname === 'localhost' ? ':3000' : '';
const socket = io.connect(`http://${hostname}${port}`);

socket.on('connect', () => {
  console.log("connected to socket")
});

socket.on('things', data => {
  console.log("got things",data);
});

let sockets = [];
let things = [];

const isThingRegistered = (thingName) => things.find(thing => thing.thingName === thingName);

const listenToSocket = (thingName, methods) => {
  for (let method of methods) {
    const successSocket = `things/${thingName}/shadow/${method}`;
    const failureSocket = `things/${thingName}/shadow/${method}/error`;
    if(sockets.indexOf(successSocket)===-1) {
      sockets.push(successSocket);
      let thing = isThingRegistered(thingName);
      console.log("listening to ",successSocket,failureSocket);
      socket.on(successSocket, shadow => {
        console.log(`received ${method} action`, shadow);
        if(thing && thing[`${method}Success`]) {
          // prevent updating more than once for same version
          if(method === 'update' && shadow.version === thing.version) {
            return;
          }
          thing[`${method}Success`](shadow);
          thing.version = shadow.version;
        }
      });
      socket.on(failureSocket, () => {
        console.log(`received ${method} Error`);
        if(thing && thing[`${method}Error`]) {
          thing[`${method}Error`]();
        }
      });
    }
  }
}

const addThing = (thingName,props) => {
  if(things.indexOf(thingName) === -1) {
    things.push({
      thingName,
      ...props
    });
  }
}

socket.on('disconnect', () => console.log("disconnected from socket"));

export default {
  getThings: ({success, error}) => {
    socket.emit('getThings');
    if(sockets.indexOf('things') === -1) {
      sockets.push('things');
      socket.on('things',success);
      socket.on('things/error', error);
    } else {
      console.log("already listening to get things")
    }
  },
  getShadow: (thingName, props) => {
    addThing(thingName, props);
    console.log("thing was added",things)
    listenToSocket(thingName,['get','update','delete']);
    socket.emit('getShadow',thingName);
  },
  deleteShadow: thingName => {
    socket.emit('deleteShadow',thingName);
  },
  updateShadow: (thingName, shadow) => {
    console.log("update to",thingName,things, shadow, isThingRegistered(thingName))
    if(!isThingRegistered(thingName)) {
      throw new Error('thing must be registered, use getShadow first');
    }
    socket.emit('updateShadow',{thingName, shadow: {state: shadow}});
  }
}
