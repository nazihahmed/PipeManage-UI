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

// TODO: remove when done testing
window.socket = socket;

let sockets = [];
let things = [];

const isThingRegistered = (thingName) => things.find(thing => thing.thingName === thingName);

const listenToForeignSocket = (thingName, methods) => {
  for (let method of methods) {
    const successSocket = `things/${thingName}/shadow/${method}`;
    if(sockets.indexOf(successSocket)===-1) {
      sockets.push(successSocket);
      let thing = isThingRegistered(thingName);
      console.log("listen to socket",successSocket, thing);
      socket.on(successSocket, shadow => {
        console.log(`received ${method} action`, shadow, thing);
        if(thing && thing[`${method}Fn`]) {
          // prevent updating more than once for same version
          console.log("before updating check version", shadow, thing);
          if(method === 'delete') {
            thing[`${method}Fn`](true);
          }
          if(method === 'update' && shadow.version === thing.version) {
            return;
          }
          thing[`${method}Fn`](shadow);
          if(shadow) {
            thing.version = shadow.version;
          }
        }
      });
    }
  }
}

const addThing = (thingName, props) => {
  if(!isThingRegistered(thingName)) {
    things.push({
      thingName,
      ...props
    });
  }
}

socket.on('disconnect', () => console.log("disconnected from socket"));

export default {
  getThings: ({success, error}) => {
    socket.emit('getThings', data => {
      if(!data) {
        error();
      }
      success(data);
    });
  },
  getThing: ({thingName, success, error}) => {
    socket.emit('getThing',thingName, data => {
      if(!data) {
        error();
      }
      success(data);
    });
  },
  updateThing: ({thingName, success, error, attributes}) => {
    socket.emit('updateThing',{thingName, attributes}, data => {
      if(!data) {
        error();
      }
      success(data);
    });
    const path = `thing/${thingName}/update`;
    console.log("foreign update ",attributes)
    if(sockets.indexOf(path) === -1) {
      sockets.push(path);
      socket.on(`${path}`,success);
    } else {
      console.log("already listening to get things")
    }
  },
  getShadow: (thingName, props, fn) => {
    addThing(thingName, props);
    console.log("thing was added",things);
    // foreign sockets
    listenToForeignSocket(thingName,['update','delete']);
    socket.emit('getShadow',thingName, (data) => {
      let thing = isThingRegistered(thingName);
      thing.version = data.version;
      fn(data);
    });
  },
  deleteShadow: thingName => {
    let thing = isThingRegistered(thingName);
    socket.emit('deleteShadow',thingName, thing.deleteFn);
  },
  updateShadow: (thingName, shadow) => {
    let thing = isThingRegistered(thingName);
    thing.version++;
    console.log("update to",thingName,things, shadow, thing);
    if(!thing) {
      throw new Error('thing must be registered, use getShadow first');
    }
    console.log("add updateFn to",thing);
    socket.emit('updateShadow',{thingName, shadow}, (data) => {
      if(!data) {
        thing.version--;
      }
      console.log("new version is",thing)
      thing.updateFn(data);
    });
  }
}
