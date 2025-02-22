<template>
    <div v-click-outside="hideRecentFavoriteMenu"
         class="gnb-recent-favorite"
         @click.stop
         @keydown.esc="hideRecentFavoriteMenu"
    >
        <span :class="{'menu-button': true, 'opened': visible}"
              tabindex="0"
              role="button"
              @keydown.enter="showRecentFavoriteMenu"
              @click.stop="handleRecentFavoriteButtonClick"
        >
            <p-i class="menu-icon"
                 name="ic_gnb_recent-favorite"
                 height="1.375rem"
                 width="1.375rem"
                 color="inherit"
            />
        </span>
        <p-tab v-show="visible"
               :tabs="tabs"
               :active-tab.sync="activeTab"
        >
            <template #recent>
                <g-n-b-recent :visible="visible && activeTab === 'recent'"
                              @close="hideRecentFavoriteMenu"
                />
            </template>
            <template #favorite>
                <g-n-b-favorite @close="hideRecentFavoriteMenu" />
            </template>
        </p-tab>
    </div>
</template>

<script lang="ts">

import { vOnClickOutside } from '@vueuse/components';
import {
    computed, defineComponent, reactive, toRefs,
} from 'vue';
import type { DirectiveFunction, SetupContext } from 'vue';

import {
    PI, PTab,
} from '@spaceone/design-system';
import type { TabItem } from '@spaceone/design-system/types/navigation/tabs/tab/type';

import { store } from '@/store';
import { i18n } from '@/translations';

import GNBFavorite from '@/common/modules/navigations/gnb/modules/gnb-recent-favorite/modules/GNBFavorite.vue';
import GNBRecent from '@/common/modules/navigations/gnb/modules/gnb-recent-favorite/modules/GNBRecent.vue';

interface Props {
    visible: boolean
}
export default defineComponent<Props>({
    name: 'GNBRecentFavorite',
    components: {
        GNBRecent,
        GNBFavorite,
        PI,
        PTab,
    },
    directives: {
        clickOutside: vOnClickOutside as DirectiveFunction,
    },
    props: {
        visible: {
            type: Boolean,
            default: false,
        },
    },
    setup(props, { emit }: SetupContext) {
        const state = reactive({
            tabs: computed(() => ([
                { label: i18n.t('COMMON.GNB.RECENT.RECENT'), name: 'recent', keepAlive: true },
                { label: i18n.t('COMMON.GNB.FAVORITES.FAVORITES'), name: 'favorite', keepAlive: true },
            ] as TabItem[])),
            activeTab: 'recent',
        });

        const setVisible = (visible: boolean) => {
            emit('update:visible', visible);
        };
        const hideRecentFavoriteMenu = () => {
            setVisible(false);
        };
        const showRecentFavoriteMenu = () => {
            setVisible(true);
        };

        /* Event */
        const handleRecentFavoriteButtonClick = () => {
            setVisible(!props.visible);
        };

        /* Init */
        (async () => {
            await Promise.allSettled([
                store.dispatch('reference/cloudServiceType/load'),
            ]);
        })();

        return {
            ...toRefs(state),
            hideRecentFavoriteMenu,
            showRecentFavoriteMenu,
            handleRecentFavoriteButtonClick,
        };
    },
});
</script>
<style lang="postcss" scoped>
.gnb-recent-favorite {
    @apply relative;

    .menu-button {
        @apply inline-flex items-center justify-center text-gray-500 rounded-full;
        width: 2rem;
        height: 2rem;
        line-height: $gnb-height;
        cursor: pointer;

        &:hover {
            @apply text-blue-600 bg-blue-100;
        }

        &.opened {
            @apply text-blue-600 bg-blue-200;
        }
    }

    /* custom design-system component - p-tab */
    :deep(.p-tab) {
        @apply absolute bg-white rounded-xs border border-gray-200;
        display: flex;
        flex-direction: column;
        width: 27.5rem;
        min-height: auto;
        top: 100%;
        right: 0;
        box-shadow: 0 0 0.5rem rgba(0, 0, 0, 0.08);
        margin-right: -0.5rem;
        z-index: 1000;
        .tab-pane {
            padding-bottom: 0;
        }
    }
}
</style>
