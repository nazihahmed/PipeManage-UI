// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import BootstrapVue from 'bootstrap-vue'
import upperFirst from 'lodash/upperFirst'
import camelCase from 'lodash/camelCase'
import io from 'socket.io-client';

// CSS
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

Vue.use(BootstrapVue);

Vue.config.productionTip = false

const requireComponent = require.context(
  // The relative path of the components folder
  './components',
  // Whether or not to look in subfolders
  false,
  // The regular expression used to match base component filenames
  /Base[A-Z]\w+\.(vue|js)$/
)

requireComponent.keys().forEach(fileName => {
  // Get component config
  const componentConfig = requireComponent(fileName)

  // Get PascalCase name of component
  const componentName = upperFirst(
    camelCase(
      // Strip the leading `./` and extension from the filename
      fileName.replace(/^\.\/(.*)\.\w+$/, '$1')
    )
  )

  // Register component globally
  Vue.component(
    componentName,
    // Look for the component options on `.default`, which will
    // exist if the component was exported with `export default`,
    // otherwise fall back to module's root.
    componentConfig.default || componentConfig
  )
});

const {hostname} = window.location;
const port = hostname === 'localhost' ? ':3000' : '';
const socket = io.connect(`http://${hostname}${port}`);

socket.on('connect', () => {
  console.log("connected to socket")
});
socket.on('things', data => {
  console.log("got things",data);
});

let sockets = [];

const listenToSocket = (topic, action) => {
  if(sockets.indexOf(topic)===-1) {
    sockets.push(topic);
    console.log("listening to ",topic)
    socket.on(topic, shadow => {
      console.log(`received ${action} shadow`, shadow);
    });
  }
}

const getShadow = thingName => {
  listenToSocket(`things/${thingName}/shadow/get`,'get');
  listenToSocket(`things/${thingName}/shadow/update`,'update');
  listenToSocket(`things/${thingName}/shadow/delete`,'delete');
  listenToSocket(`things/${thingName}/shadow/get/failed`,'failue to get');
  listenToSocket(`things/${thingName}/shadow/update/failed`,'failue to update');
  listenToSocket(`things/${thingName}/shadow/delete/failed`,'failue to delete');
  socket.emit('getShadow',thingName);
}

window.getShadow = getShadow;

const deleteShadow = thingName => {
  socket.emit('deleteShadow',thingName);
}

window.deleteShadow = deleteShadow;

const updateShadow = (thingName, desired) => {
  if(sockets.indexOf(`things/${thingName}/shadow/get`) === -1) {
    throw new Error('thing must be registered, use getShadow first');
  }
  socket.emit('updateShadow',{thingName, desired});
}

window.updateShadow = updateShadow;

socket.on('disconnect', () => console.log("disconnected from socket"));
// window.socket = socket;

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
