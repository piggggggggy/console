<script setup lang="ts">
import { reactive } from 'vue';
import type { TranslateResult } from 'vue-i18n';

import { PIconButton, PI } from '@spaceone/design-system';

import { useProxyValue } from '@/common/composables/proxy-state';

import { gray, indigo, red } from '@/styles/colors';

interface Props {
    titleIcon?: string;
    title?: string|TranslateResult;
    type?: 'info' | 'danger';
    hideHeaderCloseButton?: boolean;
    visible?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    titleIcon: '',
    title: '',
    type: 'info',
    hideHeaderCloseButton: false,
    visible: true,
});

const emit = defineEmits<{(e: 'close'): void;
    (e: 'update:visible', value: boolean): void;
}>();

const iconColorMap = {
    info: indigo[500],
    danger: red[400],
};

const state = reactive({
    proxyVisible: useProxyValue('visible', props, emit),
});

const handleCloseClick = () => {
    emit('close');
    state.proxyVisible = false;
};
</script>

<template>
    <div class="scoped-notification"
         :class="{'info': props.type}"
    >
        <p-i v-if="props.titleIcon"
             class="left-icon"
             width="1.25rem"
             height="1.25rem"
             :color="iconColorMap[props.type]"
             :name="props.titleIcon"
        />
        <div class="content-wrapper">
            <div class="left-part">
                <div class="title-wrapper">
                    {{ props.title }}
                </div>
                <div class="content-wrapper">
                    <slot />
                </div>
            </div>
            <div class="right-part">
                <slot name="right" />
            </div>
        </div>
        <p-icon-button v-if="!props.hideHeaderCloseButton"
                       name="ic_close"
                       :color="gray[400]"
                       class="close-button"
                       @click.stop="handleCloseClick"
        />
    </div>
</template>

<style scoped lang="postcss">
.scoped-notification {
    @apply flex gap-2;
    padding: 1.125rem 1.5rem;

    .left-icon {
        margin: 0.125rem 0;
    }

    .content-wrapper {
        @apply flex-grow;
        .left-part {
            .title-wrapper {
                height: 1.5rem;

                @apply text-label-lg font-bold;
                line-height: 1.5rem;
            }
        }
        .right-part {
            @apply flex-shrink-0 flex items-center;
        }
    }

    &.info {
        @apply bg-indigo-100;
        .title-wrapper {
            @apply text-indigo-600;
        }
    }
}
</style>
