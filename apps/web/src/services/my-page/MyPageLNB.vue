<template>
    <l-n-b :header="header"
           :menu-set="menuSet"
    >
        <template #default>
            <div class="member-profile">
                <p-i class="member-icon"
                     :name="icon"
                     width="3rem"
                     height="3rem"
                />
                <p class="member-id">
                    {{ userId }}
                </p>
                <p class="member-type">
                    {{ memberType }}
                </p>
            </div>
        </template>
    </l-n-b>
</template>

<script lang="ts">
import {
    computed, defineComponent, reactive, toRefs,
} from 'vue';

import { PI } from '@spaceone/design-system';

import { store } from '@/store';
import { i18n } from '@/translations';

import {
    filterLNBMenuByAccessPermission,
} from '@/lib/access-control/page-access-helper';
import { MENU_ID } from '@/lib/menu/config';
import { MENU_INFO_MAP } from '@/lib/menu/menu-info';

import LNB from '@/common/modules/navigations/lnb/LNB.vue';
import type { LNBMenu } from '@/common/modules/navigations/lnb/type';

import { MY_PAGE_ROUTE } from '@/services/my-page/routes/route-constant';

export default defineComponent({
    name: 'MyPageLNB',
    components: {
        PI,
        LNB,
    },
    setup() {
        const state = reactive({
            isDomainOwner: computed(() => store.getters['user/isDomainAdmin']),
            hasPermission: computed(() => store.getters['user/hasPermission']),
            userType: computed(() => store.state.user.backend) as unknown as string,
            userName: computed(() => store.state.user.name),
            email: computed(() => store.state.user.email),
            userId: computed(() => store.state.user.userId),
            icon: computed(() => {
                if (state.isDomainOwner) return 'img_avatar_root-account';
                return 'img_avatar_user';
            }),
            memberType: computed(() => {
                if (state.isDomainOwner) return i18n.t('MY_PAGE.ROOT_ACCOUNT');
                return i18n.t('MY_PAGE.SPACEONE_USER');
            }),
            header: computed<string>(() => i18n.t(MENU_INFO_MAP[MENU_ID.MY_PAGE].translationId) as string),
            menuSet: computed<LNBMenu[]>(() => {
                const allLnbMenu: LNBMenu[] = [
                    {
                        type: 'title',
                        label: i18n.t(MENU_INFO_MAP[MENU_ID.ACCOUNT].translationId),
                        id: MENU_ID.ACCOUNT,
                        foldable: false,
                    },
                    {
                        type: 'item',
                        label: i18n.t(MENU_INFO_MAP[MENU_ID.ACCOUNT_PROFILE].translationId),
                        id: MENU_ID.ACCOUNT_PROFILE,
                        to: { name: MY_PAGE_ROUTE.MY_ACCOUNT.ACCOUNT_PROFILE._NAME },
                    },
                    {
                        type: 'item',
                        label: i18n.t(MENU_INFO_MAP[MENU_ID.NOTIFICATIONS].translationId),
                        id: MENU_ID.NOTIFICATIONS,
                        to: { name: MY_PAGE_ROUTE.MY_ACCOUNT.NOTIFICATION._NAME },
                        hightlightTag: 'beta',
                    },
                ];
                return filterLNBMenuByAccessPermission(allLnbMenu, store.getters['user/pageAccessPermissionList']);
            }),
        });

        return {
            ...toRefs(state),
        };
    },
});

</script>

<style lang="postcss" scoped>
.member-profile {
    text-align: center;
    vertical-align: middle;
    padding: 1rem 2.125rem;
    margin-top: 1.5rem;
    margin-bottom: 2.125rem;
    width: 14.75rem;
    height: 7.875rem;
    .member-icon {
        @apply mx-auto rounded-full;
        width: 3rem;
        height: 3rem;
        margin-bottom: 0.5rem;
        overflow: hidden;
    }
    .member-id {
        @apply text-gray-900;
        font-size: 0.875rem;
        margin-bottom: 0.25rem;
        line-height: 140%;
    }
    .member-type {
        @apply text-gray-500;
        font-size: 0.75rem;
        line-height: 120%;
    }
}
</style>
