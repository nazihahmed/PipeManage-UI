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
            <p><strong>ARN</strong>: {{thing.thingArn}}</p>
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
            <p><strong>ID</strong>: {{thing.thingId}}</p>
            <p><strong>Defalt Client ID</strong>: {{thing.defaultClientId}}</p>
            <b-button-group vertical v-if="!edit">
              <b-button variant="primary" @click="getShadow()">Get Shadow</b-button>
              <b-button variant="warning" @click="updateShadow()">Update Shadow</b-button>
              <b-button variant="danger" @click="deleteShadow()">Delete Shadow</b-button>
            </b-button-group>
            <br><br>
            <b-button variant="info" @click="insertSample()" v-if="!edit">Insert Sample Data</b-button>
            <b-button variant="info" @click="saveChanges()" v-if="edit">{{updating ? "Updating...":"Save Changes"}}</b-button>
          </b-col>
          <b-col cols="7">
            <br>
            <vue-json-editor v-model="shadow" :showBtns="false"></vue-json-editor>
          </b-col>
      </b-row>
  </b-container>
</template>
<script>
import shadow from '@/shadow';
import vueJsonEditor from 'vue-json-editor'
import _ from 'lodash'
export default {
  data () {
    return {
      shadow: {},
      thing: {},
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
    getShadow() {
      shadow.getShadow(this.name, {
        updateFn: shadow => {
          if(!shadow) {
            return this.error('Failed to update shadow', {
              timeout: 2000
            });
          }
          this.shadow = shadow;
          this.success('Shadow was updated!', {
            timeout: 2000
          });
        },
        deleteFn: res => {
          if(!res) {
            return this.error('Failed to delete shadow', {
              timeout: 2000
            });
          }
          this.shadow = {};
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
          // this.thing = data;
          console.log("updated thing details", data)
          this.info('Updated thing', {
            timeout: 2000
          });
        }
      }, shadow => {
        if(!shadow) {
          return this.error('No shadow was found, update first', {
            timeout: 2000
          });
        }
        console.log("got shadow", shadow);
        this.shadow = shadow;
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
  },
  components: {
    vueJsonEditor
  }
}
</script>
