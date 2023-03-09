import type { App } from 'vue';
import VueGtag from 'vue-gtag';

import { GTag } from '@/lib/gtag';
import { Gtm } from '@/lib/gtm';

export const initGtag = (store, config, app: App) => {
    const gtagId: string = config.get('GTAG_ID');
    if (!gtagId && gtagId === 'DISABLED') return;

    // Register Gtag
    app.use(VueGtag, {
        config: { id: gtagId },
    });
    GTag.init(app.config.globalProperties.$gtag ?? null);
    store.watch((state) => state.user.userId, (userId) => {
        GTag.setGtagUserID(store.state.domain.domainId, userId);
    }, { immediate: true });
};

export const initGtm = (config) => {
    if (config.get('GTM_ID') === 'DISABLED') return;
    Gtm.init();
};
