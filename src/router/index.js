import Vue from 'vue'
import Router from 'vue-router'
import Things from '@/components/Things'
import Thing from '@/components/Thing'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'Things',
      component: Things
    },
    {
      path: '/thing/:name',
      name: 'Thing',
      component: Thing
    }
  ]
})
