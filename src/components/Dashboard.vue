<template>
  <div>
    <b-container fluid>
      <div v-for="row in bRows" :key="row">
        <br>
        <b-card-group>
          <BaseBlock v-for="nav in baseNavs" :key="nav"/>
        </b-card-group>
      </div>
    </b-container>
  </div>
</template>

<script>
export default {
  data () {
    return {
      baseNavs: new Array(3),
      bRows: new Array(2)
    };
  },
  methods: {
    countDownChanged (dismissCountDown) {
      this.dismissCountDown = dismissCountDown
    },
    showAlert () {
      this.dismissCountDown = this.dismissSecs
    }
  }
}
</script>
