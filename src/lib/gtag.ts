import Vue from 'vue';
import type { VueGtag as VueGtagType } from 'vue-gtag';
import VueGtag from 'vue-gtag';
import type { RouteLocationNormalized } from 'vue-router';

import Hashids from 'hashids';

import config from '@/lib/config';

export class GTag {
    private static _gtag: VueGtagType|null;

    constructor(value) {
        GTag._gtag = value;
    }

    static init(globalProperties) {
        new GTag(globalProperties);
    }

    static get gtag(): VueGtagType|null {
        return GTag._gtag;
    }

    static setGtagUserID(domainId?: string, userId?: string) {
        if (GTag.gtag) {
            try {
                if (domainId && userId) {
                    const hashids = new Hashids(userId);
                    // eslint-disable-next-line camelcase
                    GTag.gtag.set({
                        user_id: `${domainId}:${hashids.encode(1)}`,
                        domain_id: domainId,
                    });
                }
            } catch (e) {
                console.error('failed to init gtag', e);
            }
        } else if (config.get('GTAG_ID') !== 'DISABLED') {
            console.error('GTag is not initialized.');
        }
    }

    static setPageView(to: RouteLocationNormalized) {
        if (GTag.gtag) {
            GTag.gtag.pageview({
                // eslint-disable-next-line camelcase
                page_path: to.path,
            });
        }
    }
}
