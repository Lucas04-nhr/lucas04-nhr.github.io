import { createRouter, createWebHistory } from 'vue-router';
import Home from '../components/Home.vue';
import About from '../components/About.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    component: About
  },
  {
    path: '/vueindex',
    name: 'VueIndex',
    component: () => import('../components/VueIndex.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
