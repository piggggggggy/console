<template>
    <p-centered-layout class="centered-page-layout">
        <template v-if="!props.hasNavBar"
                  #top-contents
        >
            <g-n-b-logo class="gnb-logo"
                        :to="{ name: ROOT_ROUTE._NAME }"
            />
        </template>
        <template #default>
            <slot />
        </template>
    </p-centered-layout>
</template>

<script setup lang="ts">

import { PCenteredLayout } from '@spaceone/design-system';

import { ROOT_ROUTE } from '@/router/constant';

import GNBLogo from '@/common/modules/navigations/gnb/modules/GNBLogo.vue';

interface Props {
    hasNavBar?: boolean
}
const props = withDefaults(defineProps<Props>(), {
    hasNavBar: false,
});
</script>
