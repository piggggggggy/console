<template>
    <section class="notification-wrapper">
        <p-heading :title="$t('MY_PAGE.NOTIFICATION.NOTIFICATION')" />
        <p-pane-layout>
            <notification-channel-list />
        </p-pane-layout>
    </section>
</template>

<script lang="ts">
import {
    reactive, toRefs,
} from 'vue';

import {
    PHeading, PPaneLayout,
} from '@spaceone/design-system';

import NotificationChannelList from '@/services/my-page/components/NotificationChannelList.vue';

export default {
    name: 'UserNotificationPage',
    components: {
        NotificationChannelList,
        PHeading,
        PPaneLayout,
    },
    setup() {
        const state = reactive({
        });
        return {
            ...toRefs(state),
        };
    },
};
</script>
