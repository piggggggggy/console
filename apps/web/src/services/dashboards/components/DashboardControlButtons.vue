<script setup lang="ts">
import { PButton } from '@spaceone/design-system';

import { SpaceRouter } from '@/router';


import { DASHBOARDS_ROUTE } from '@/services/dashboards/routes/route-constant';

const emit = defineEmits(['update:visible-clone-modal']);

const handleVisibleCloneModal = () => {
    emit('update:visible-clone-modal');
};

const props = defineProps<{
    dashboardId: string;
    name?: string;
}>();

const handleClickCustomize = () => {
    SpaceRouter.router.push({
        name: DASHBOARDS_ROUTE.CUSTOMIZE._NAME,
        params: { dashboardId: props.dashboardId },
    });
};

</script>

<template>
    <div class="dashboard-control-buttons">
        <p-button icon-left="ic_dashboard-customize"
                  style-type="tertiary"
                  @click="handleClickCustomize"
        >
            {{ $t('DASHBOARDS.DETAIL.CUSTOMIZE') }}
        </p-button>
        <p-button icon-left="ic_duplicate"
                  style-type="tertiary"
                  @click="handleVisibleCloneModal"
        >
            {{ $t('DASHBOARDS.DETAIL.CLONE') }}
        </p-button>
    </div>
</template>

<style lang="postcss">
.dashboard-control-buttons {
    @apply flex justify-end;
    gap: 0.75rem;
}
</style>
