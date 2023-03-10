import type { App } from 'vue';
import VueGtag from 'vue-gtag';

// TODO: may be need version upgrade
import VueGtm from '@gtm-support/vue-gtm';

import { GTag } from '@/lib/gtag';
import { Gtm } from '@/lib/gtm';

export const initGtag = (store, config, app: App) => {
    const gtagId: string = config.get('GTAG_ID');
    if (!gtagId && gtagId === 'DISABLED') {
        console.log('GTG ID is not given.');
        return;
    }

    // Register Gtag
    app.use(VueGtag, {
        config: { id: gtagId },
    });
    GTag.init(app.config.globalProperties.$gtag ?? null);
    store.watch((state) => state.user.userId, (userId) => {
        GTag.setGtagUserID(store.state.domain.domainId, userId);
    }, { immediate: true });
};

export const initGtm = (config, app: App) => {
    const gtmId: string = config.get('GTM_ID');
    if (!gtmId && gtmId === 'DISABLED') {
        console.log('GTM ID in not given.');
        return;
    }

    // Register Gtm
    app.use(VueGtm, {
        id: gtmId,
        defer: false,
        compatibility: false,
        nonce: '',
        enabled: true,
        trackOnNextTick: false,
    });
    Gtm.init();
};
