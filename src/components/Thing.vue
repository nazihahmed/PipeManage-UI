<template>
  <b-card title="Card title"
          sub-title="Card subtitle">
      <p class="card-text">
          {{ $route.params.name }}
      </p>
      <a href="#"
         class="card-link" @click.prevent="getShadow($route.params.name)">Get Shadow</a>
      <b-link href="#"
              class="card-link">Delete Shadow</b-link>
  </b-card>
</template>
<script>
import shadow from '@/shadow';
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
    },
    getShadow(name) {
      shadow.getShadow(name, {
        getSuccess: shadow => {
          console.log("got shadow", shadow);
        },
        updateSuccess: shadow => {
          console.log("shadow was updated", shadow)
        },
        deleteSuccess: shadow => {
          console.log("shadow was deleted", shadow)
        }
      });
    }
  }
}
</script>
