<template>
    <div class="notice-page">
        <p-heading :title="$t('INFO.NOTICE.MAIN.NOTICE_TITLE')">
            <template #extra>
                <p-button v-if="hasDomainRoleUser || hasSystemRoleUser"
                          style-type="secondary"
                          icon-left="ic_plus_bold"
                          @click="handleCreateNotice"
                >
                    {{ $t('INFO.NOTICE.FORM.CREATE_NOTICE') }}
                </p-button>
            </template>
        </p-heading>
        <notice-list />
    </div>
</template>

<script lang="ts">
import { computed, reactive, toRefs } from 'vue';

import {
    PButton, PHeading,
} from '@spaceone/design-system';

import { SpaceRouter } from '@/router';
import { store } from '@/store';

import NoticeList from '@/services/info/components/NoticeList.vue';
import { INFO_ROUTE } from '@/services/info/routes/route-constant';

export default {
    name: 'NoticeMainPage',
    components: {
        PHeading,
        PButton,
        NoticeList,
    },
    setup() {
        const state = reactive({
            hasDomainRoleUser: computed(() => store.getters['user/isDomainAdmin']),
            hasSystemRoleUser: computed(() => store.getters['user/hasSystemRole']),
        });
        const handleCreateNotice = () => {
            SpaceRouter.router.push({ name: INFO_ROUTE.NOTICE.CREATE._NAME });
        };

        return {
            ...toRefs(state),
            handleCreateNotice,
        };
    },
};
</script>


