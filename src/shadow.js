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
  for (method of methods) {
    const successSocket = `things/${thingName}/shadow/${method}`;
    const failureSocket = `things/${thingName}/shadow/${method}/error`;
    if(sockets.indexOf(socket)===-1) {
      sockets.push(socket,failureSocket);
      console.log("listening to ",topic);
      socket.on(successSocket, shadow => {
        console.log(`received ${action} action`, shadow);
        let thing = isThingRegistered(thingName);
        if(thing && thing[`${method}Sucess`]) {
          thing[`${method}Sucess`]();
          if (method === 'delete') {
            things = things.filter(thing => thing.thingName !== thingName);
          }
        }
      });
      socket.on(failureSocket, () => {
        console.log(`received ${action} Error`, shadow);
        if(thing && thing[`${method}Error`]) {
          thing[`${method}Sucess`]();
          if (method === 'delete') {
            things = things.filter(thing => thing.thingName !== thingName);
          }
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
  getShadow: thingName, props => {
    addThing(thingName, props);
    listenToSocket(thingName,['get','update','delete']);
    // listenToSocket(`things/${thingName}/shadow/update`);
    // listenToSocket(`things/${thingName}/shadow/delete`);
    // listenToSocket(`things/${thingName}/shadow/get/failed`,'failue to get');
    // listenToSocket(`things/${thingName}/shadow/update/failed`,'failue to update');
    // listenToSocket(`things/${thingName}/shadow/delete/failed`,'failue to delete');
    socket.emit('getShadow',thingName);
  },
  deleteShadow: thingName => {
    socket.emit('deleteShadow',thingName);
  },
  updateShadow: (thingName, desired) => {
    if(isThingRegistered(thingName)) {
      throw new Error('thing must be registered, use getShadow first');
    }
    socket.emit('updateShadow',{thingName, desired});
  }
}
