<template>
  <b-card v-bind:title="thing.thingTypeName"
          v-bind:sub-title="thing.attributes.version">
      <p class="card-text text-left">
          <strong>ThingName:</strong> {{thing.thingName}} <br>
          <strong>Thing ARN:</strong> {{thing.thingArn}} <br>
          <strong>Country:</strong> {{thing.attributes.country}} <br>
      </p>
      <a v-bind:href="'/thing/'+thing.thingName"
         class="card-link">View thing</a>
      <b-link href="#"
              class="card-link">Delete Thing</b-link>
  </b-card>
</template>
<script>
export default {
  props: ["thing"],
  mounted() {
      console.log("component mounted")
  }
}
</script>
