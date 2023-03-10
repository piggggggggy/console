// import Vue from 'vue';
import { createApp } from 'vue';

import LottieVuePlayer from '@lottiefiles/vue-lottie-player';
import SpaceDesignSystem from '@spaceone/design-system';
import FloatingVue from 'floating-vue';
import { PiniaVuePlugin, createPinia } from 'pinia';
import PortalVue from 'portal-vue';

import directive from '@/directives';
import { store } from '@/store';
import { i18n } from '@/translations';

import { resetStore } from '@/lib/reset-pinia-store';
import { siteInit } from '@/lib/site-initializer';


import App from './App.vue';

import '@/styles/style.pcss';
import '@spaceone/design-system/css/light-style.css';
import '@spaceone/design-system/dist/style.css';

const pinia = createPinia();
pinia.use(resetStore);

export const app = createApp(App);

/** ********** SET VUE PLUGINS ************** */
// TODO: Must refactor
// app.use(VTooltip, { defaultClass: 'p-tooltip', defaultBoundariesElement: document.body });
app.use(FloatingVue, { boundary: document.body });
app.use(PortalVue);
app.use(store);
app.use(PiniaVuePlugin);
app.use(i18n);
app.use(pinia);

directive(app);
app.use(LottieVuePlayer);
app.use(SpaceDesignSystem, { vueI18n: i18n });

/** ********** INITIALIZE ************** */
(async () => {
    await siteInit(app);
    app.mount('#app');
})();
