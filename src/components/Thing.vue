<style media="screen">
  p {
     word-wrap: break-word;
  }
</style>
<template>
  <b-container fluid class="bv-example-row">
      <b-row>
          <b-col cols="5" class="text-left">
            <br>
            <input type="text" v-if="thing && edit" v-bind:value="thing.attributes.alias">
            <h2 v-if="thing && !edit">{{ thing.attributes.alias }}</h2><a href="#" @click="switchEditMode()">{{edit ? "Cancel" : "Edit"}}</a>
            <p v-if="thing"><strong>Name</strong>: {{thing.thingName}}</p>
            <p v-if="thing"><strong>ARN</strong>: {{thing.thingArn}}</p>
            <p v-if="thing && thing.thingTypeName"><strong>type</strong>: {{thing.thingTypeName}}</p>
            <strong>Country</strong>:
            <input type="text" v-if="thing && edit" v-bind:value="thing.attributes.country">
            <p v-if="thing && thing.attributes.country && !edit">{{thing.attributes.country}}</p>
            <p v-if="thing"><strong>ID</strong>: {{thing.thingId}}</p>
            <p v-if="thing"><strong>Defalt Client ID</strong>: {{thing.defaultClientId}}</p>
            <b-button-group vertical v-if="!edit">
              <b-button variant="primary" @click="getShadow()">Get Shadow</b-button>
              <b-button variant="warning" @click="updateShadow()">Update Shadow</b-button>
              <b-button variant="danger" @click="deleteShadow()">Delete Shadow</b-button>
            </b-button-group>
            <br><br>
            <b-button variant="info" @click="insertSample()" v-if="!edit">Insert Sample Data</b-button>
            <b-button variant="info" @click="saveChanges()" v-if="edit">Save Changes</b-button>
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
      edit: false
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
    getThing() {
      this.edit = false;
      this.thing = shadow.getThing({
        thingName: this.name,
        success: data => {
          this.thing = data;
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
        getSuccess: shadow => {
          console.log("got shadow", shadow);
          this.shadow = shadow;
          this.info('Received shadow', {
            timeout: 2000
          });
        },
        updateSuccess: shadow => {
          this.shadow = shadow;
          this.success('Shadow was updated!', {
            timeout: 2000
          });
        },
        deleteSuccess: shadow => {
          this.shadow = {};
          this.success('Shadow was deleted!', {
            timeout: 2000
          });
        },
        deleteError: () => {
          this.error('Failed to delete shadow', {
            timeout: 2000
          });
        },
        updateError: () => {
          this.error('Failed to update shadow', {
            timeout: 2000
          });
        },
        getError: () => {
          this.error('No shadow was found, update first', {
            timeout: 2000
          });
        }
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
