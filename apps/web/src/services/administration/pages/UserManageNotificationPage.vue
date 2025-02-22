<template>
    <div class="manage-notification-page">
        <p-breadcrumbs class="flex-grow"
                       :routes="routeState.routes"
        />
        <p-heading show-back-button
                   :title="$t('IAM.USER.MAIN.NOTIFICATION')"
                   @click-back-button="goToUserManagement"
        />
        <notification-channel-list :manage-disabled="!isManageable" />
    </div>
</template>

<script lang="ts">
import {
    computed, getCurrentInstance, reactive, toRefs,
} from 'vue';
import type { Vue } from 'vue/types/vue';

import { PBreadcrumbs, PHeading } from '@spaceone/design-system';

import { store } from '@/store';
import { i18n } from '@/translations';

import { ADMINISTRATION_ROUTE } from '@/services/administration/routes/route-constant';
import NotificationChannelList from '@/services/my-page/components/NotificationChannelList.vue';

export default {
    name: 'ManageNotificationPage',
    components: {
        NotificationChannelList,
        PBreadcrumbs,
        PHeading,
    },
    setup() {
        const vm = getCurrentInstance()?.proxy as Vue;
        const state = reactive({
            isManageable: computed(() => store.getters['user/isDomainAdmin']),
        });
        const routeState = reactive({
            routes: computed(() => ([
                { name: 'Administration', to: { name: ADMINISTRATION_ROUTE._NAME } },
                { name: 'IAM', to: { name: ADMINISTRATION_ROUTE.IAM._NAME } },
                { name: 'User Management', to: { name: ADMINISTRATION_ROUTE.IAM.USER._NAME } },
                { name: i18n.t('IAM.USER.NOTIFICATION.MANAGE_CHANNEL') },
            ])),
        });
        const goToUserManagement = () => {
            vm.$router.push({ name: ADMINISTRATION_ROUTE.IAM.USER._NAME });
        };
        return {
            ...toRefs(state),
            routeState,
            goToUserManagement,
        };
    },
};
</script>
