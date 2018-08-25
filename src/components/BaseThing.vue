<template>
  <b-card v-bind:title="thing.attributes.alias"
          v-bind:sub-title="thing.thingTypeName">
      <p class="card-text text-left">
          <strong>ThingName:</strong> {{thing.thingName}} <br>
          <strong>Thing ARN:</strong> {{thing.thingArn}} <br>
          <strong v-if="thing.attributes.country">Country:</strong> {{thing.attributes.country}} <br>
      </p>
      <router-link :to="{ name: 'thing', params: { name: thing.thingName }}" class="card-link">View thing</router-link>
      <b-link href="#"
              class="card-link">Delete Thing</b-link>
  </b-card>
</template>
<script>
export default {
  props: ["thing"]
}
</script>
