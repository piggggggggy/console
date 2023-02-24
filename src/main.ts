import Vue from 'vue';
import { createApp } from 'vue/dist/vue.esm-bundler';

import LottieVuePlayer from '@lottiefiles/vue-lottie-player';
import SpaceDesignSystem from '@spaceone/design-system';
import { PiniaVuePlugin, createPinia } from 'pinia';
import PortalVue from 'portal-vue';
import VTooltip from 'v-tooltip';

import directive from '@/directives';
import { SpaceRouter } from '@/router';
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

const app = createApp({
    pinia,
    i18n,
    router: SpaceRouter.router,
    ...App,
});

/** ********** SET VUE PLUGINS ************** */
app.use(VTooltip, { defaultClass: 'p-tooltip', defaultBoundariesElement: document.body });
app.use(PortalVue);
app.use(store);
app.use(PiniaVuePlugin);

directive(Vue);

app.use(LottieVuePlayer);
app.use(SpaceDesignSystem, { vueI18n: i18n });

/** ********** INITIALIZE ************** */
(async () => {
    await siteInit();
    app.mount('##app');
})();


