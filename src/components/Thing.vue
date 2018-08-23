<template>
  <b-container fluid class="bv-example-row">
      <b-row>
          <b-col cols="5" class="text-left">
            <br>
            <h2>Thing</h2>
            <p>{{ $route.params.name }}</p>
            <b-button-group vertical>
              <b-button variant="primary" @click.prevent="getShadow()">Get Shadow</b-button>
              <b-button variant="warning" @click.prevent="updateShadow()">Update Shadow</b-button>
              <b-button variant="danger" @click.prevent="deleteShadow()">Delete Shadow</b-button>
            </b-button-group>
            <br><br>
            <b-button variant="info" @click.prevent="insertSample()">Insert Sample Data</b-button>
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
      shadow: {}
    };
  },
  methods: {
    countDownChanged (dismissCountDown) {
      this.dismissCountDown = dismissCountDown
    },
    showAlert () {
      this.dismissCountDown = this.dismissSecs
    },
    insertSample() {
      console.log("inserting Sample")
      this.shadow = {
        "desired": {
          "welcome": "aws-iot"
        },
        "reported": {
          "welcome": "aws-iot"
        }
      };
    },
    getShadow() {
      shadow.getShadow(this.$route.params.name, {
        getSuccess: shadow => {
          console.log("got shadow", shadow);
          this.shadow = shadow.state;
          this.info('got shadow back', {
            timeout: 2000
          });
        },
        updateSuccess: shadow => {
          this.shadow = shadow.state;
          this.success('shadow was updated!', {
            timeout: 2000
          });
        },
        deleteSuccess: shadow => {
          this.shadow = {};
          this.success('shadow was deleted!', {
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
      shadow.updateShadow(this.$route.params.name,  _.cloneDeep(this.shadow));
    },
    deleteShadow() {
      shadow.deleteShadow(this.$route.params.name);
    }
  },
  components: {
    vueJsonEditor
  }
}
</script>
