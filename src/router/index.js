import Vue from 'vue'
import Router from 'vue-router'
import Things from '@/components/Things'
import Thing from '@/components/Thing'

Vue.use(Router)

export default new Router({
  // mode: 'history',
  routes: [
    {
      path: '/',
      name: 'things',
      component: Things
    },
    {
      path: '/thing/:name',
      name: 'thing',
      component: Thing
    }
  ]
})
