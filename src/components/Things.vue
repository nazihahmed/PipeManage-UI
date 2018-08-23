<template>
  <div>
    <b-container fluid>
      <br>
      <b-button variant="info" @click.prevent="getThings()">Load things</b-button>
      <br><br>
      <b-card-group>
        <BaseThing v-for="thing in things" v-bind:thing="thing" :key="nav"/>
      </b-card-group>
    </b-container>
  </div>
</template>

<script>
import shadow from '@/shadow';
export default {
  data () {
    return {
      things: [],
      bRows: new Array(3)
    };
  },
  created() {
    this.getThings();
  },
  methods: {
    getThings() {
      shadow.getThings({
        success: (data) => {
          this.things = data.things
          this.info("received things", {
            timeout: 1000
          });
        }
      });
    }
  }
}
</script>
