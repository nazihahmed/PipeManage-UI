<style media="screen">
  p {
     word-wrap: break-word;
  }
</style>
<template>
  <b-container fluid class="bv-example-row">
      <b-row v-if="thing">
          <b-col cols="5" class="text-left">
            <br>
            <h2 v-if="!edit">{{ thing.attributes.alias }}</h2>
            <a href="#" @click="switchEditMode()" v-if="thing">{{edit ? "Cancel" : "Edit"}}</a>
            <b-form-group label="Alias:"
                          v-if="edit"
                          label-for="aliasInput">
              <b-form-input id="aliasInput"
                            type="text"
                            v-model="newAlias"
                            required
                            placeholder="Enter new alias">
              </b-form-input>
            </b-form-group>
            <p><strong>Name</strong>: {{thing.thingName}}</p>
            <p v-if="thing.thingTypeName"><strong>type</strong>: {{thing.thingTypeName}}</p>
            <b-form-group label="Country:"
                          v-if="thing && edit"
                          label-for="countryInput">
              <b-form-input id="countryInput"
                            type="text"
                            v-model="newCountry"
                            required
                            placeholder="Enter new alias">
              </b-form-input>
            </b-form-group>
            <p v-if="thing.attributes.country && !edit"><strong v-if="thing">Country:</strong>{{thing.attributes.country}}</p>
            <b-button variant="info" @click="saveChanges()" v-if="edit">{{updating ? "Updating...":"Save Changes"}}</b-button>
          </b-col>
          <b-col cols="7">
            <br>
          </b-col>
      </b-row><br>
      <b-row v-if="sensors">
        <b-col cols="12">
          <b-card-group deck>
            <b-card v-for="(sensor, index) in sensors"
                    v-if="index<3"
                    :key="index"
                    header-tag="header"
                    footer-tag="footer">
                <h6 slot="header"
                    class="mb-0">{{sensor.name}}</h6>
                <em slot="footer" :class="getSensorTextClass(sensor)">{{getSensorText(sensor)}}</em>
                <p class="card-text">Pump: <b-badge :variant="getRelayVariant(sensor.relay)">{{getRelayText(sensor.relay)}}</b-badge> <b-badge variant="primary">AUTO</b-badge></p>
                <b-button-group size="sm">
                  <b-button @click="toggleRelayState(sensor.relay)"
                  :variant="getRelayOnOffVariant(sensor.relay)">Turn {{getRelayOnOffText(sensor.relay)}} Pump</b-button>
                  <b-button @click="toggleRelayState(sensor.relay)"
                  variant="success">Auto Mode</b-button>
                </b-button-group>
            </b-card>
          </b-card-group>
          <br>
          <b-card-group deck>
            <b-card v-for="(sensor, index) in sensors"
                    v-if="index>=3"
                    :key="index + '-2'"
                    header-tag="header"
                    footer-tag="footer">
                <h6 slot="header"
                    class="mb-0">{{sensor.name}}</h6>
                <em slot="footer" :class="getSensorTextClass(sensor)">{{getSensorText(sensor)}}</em>
                <p class="card-text">Pump: <b-badge :variant=getRelayVariant(sensor.relay)>{{getRelayText(sensor.relay)}}</b-badge> <b-badge variant="primary">AUTO</b-badge></p>
                <b-button-group size="sm">
                  <b-button @click="toggleRelayState(sensor.relay)"
                  :variant="getRelayOnOffVariant(sensor.relay)">Turn {{getRelayOnOffText(sensor.relay)}} Pump</b-button>
                  <b-button @click="toggleRelayState(sensor.relay)"
                  variant="success">Auto Mode</b-button>
                </b-button-group>
            </b-card>
          </b-card-group>
        </b-col>
      </b-row>
  </b-container>
</template>
<script>
import shadow from '@/shadow';
import _ from 'lodash';
const getPinsFromState = (reported,key) => {
  return Object.keys(reported)
        .filter(pin => reported[pin].name && reported[pin].name.indexOf(key) != -1)
        .reduce((obj, key) => {
          obj[key] = reported[key];
          if(reported[key].name) {
            obj[key]['number'] = parseInt(reported[key].name.split(" ")[1]);
            obj[key]['pin'] = key;
          }
          return obj;
        }, {})
};

const objectToArray = (obj) => {
  return Object.keys(obj).map((k) => obj[k])
};

const mapSensorsRelays = (sensors,relays) => {
  sensors = objectToArray(objectToArray(sensors));
  relays = objectToArray(objectToArray(relays));
  return sensors.map(sensor => {
    const relay = relays.find(relay => relay.number === sensor.number);
    return {
      ...sensor,
      relay
    };
  });
}

export default {
  data () {
    return {
      thing: {},
      sensors: {},
      edit: false,
      updating: false,
      newCountry: "",
      newAlias: ""
    };
  },
  created() {
    this.name = this.$route.params.name;
    this.getShadow();
    this.getThing();
  },
  methods: {
    getSensorText(sensor) {
      return sensor.state === 1 ? 'OK' : 'LOW LEVEL';
    },
    getRelayText(relay) {
      return relay.state === 1 ? 'ON' : 'OFF';
    },
    getSensorTextClass(sensor) {
      return sensor.state === 1 ? 'text-success' : 'text-danger';
    },
    getRelayVariant(relay) {
      return relay.state === 1 ? 'primary' : 'secondary';
    },
    getRelayOnOffText(relay) {
      return relay.state === 1 ? 'Off' : 'On';
    },
    getRelayOnOffVariant(relay) {
      return relay.state === 1 ? 'secondary' : 'primary';
    },
    toggleRelayState(relay) {
      shadow.updateShadow(this.name,  {
        "state": {
          "desired": {
            [relay.pin]: {
              state: relay.state === 0 ? 1 : 0
            }
          }
        }
      });
    },
    switchEditMode() {
      if(this.edit) {
        // was in edit and canceling
        return this.getThing();
      }
      this.edit = !this.edit;
    },
    saveChanges() {
      this.updating = true;
      shadow.updateThing({
        thingName: this.name,
        attributes: {
          country: this.newCountry,
          alias: this.newAlias
        }
      });
    },
    getThing() {
      this.edit = false;
      this.thing = shadow.getThing({
        thingName: this.name,
        success: data => {
          this.thing = data;
          this.newCountry = this.thing.attributes.country;
          this.newAlias = this.thing.attributes.alias;
          console.log("received thing details", data)
        }
      });
    },
    insertSample() {
      this.shadow = {
        "state": {
          "desired": {
            "welcome": "aws-iot"
          },
          "reported": {
            "welcome": "aws-iot"
          }
        }
      };
    },
    getShadow(isUpdate) {
      shadow.getShadow(this.name, {
        updateFn: shadow => {
          if(!shadow) {
            return this.error('Failed to update shadow', {
              timeout: 2000
            });
          }
          if(!isUpdate) {
            setTimeout(() => this.getShadow(true),700);
          }
        },
        deleteFn: res => {
          if(!res) {
            return this.error('Failed to delete shadow', {
              timeout: 2000
            });
          }
          this.success('Shadow was deleted!', {
            timeout: 2000
          });
        },
        updateThingFn: data => {
          this.updating = false;
          this.edit = false;
          if(!data) {
            return this.error('Failed to update thing', {
              timeout: 2000
            });
          }
          this.getThing();
          this.info('Updated thing', {
            timeout: 2000
          });
        }
      }, shadow => {
        if(isUpdate) {
          if(shadow) {
            console.log(" is update")
            if(shadow.state && shadow.state.reported) {
              const reported = JSON.parse(JSON.stringify(shadow.state.reported));
              return this.sensors = mapSensorsRelays(getPinsFromState(reported, 'sensor'), getPinsFromState(reported, 'relay'));
              console.log("sensors",this.sensors)
            }
            // return this.shadow = shadow;
          }
          return;
        }
        if(!shadow) {
          return this.error('No shadow was found, update first', {
            timeout: 2000
          });
        }
        if(shadow.state && shadow.state.reported) {
          const reported = JSON.parse(JSON.stringify(shadow.state.reported));
          this.sensors = mapSensorsRelays(getPinsFromState(reported, 'sensor'), getPinsFromState(reported, 'relay'));
        }
        this.info('Received shadow', {
          timeout: 2000
        });
      });
    },
    updateShadow() {
      shadow.updateShadow(this.name,  _.cloneDeep(_.pick(this.shadow,"state")));
    },
    deleteShadow() {
      shadow.deleteShadow(this.name);
    }
  }
}
</script>
