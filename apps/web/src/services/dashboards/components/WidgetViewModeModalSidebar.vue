<script setup lang="ts">
import {
    computed, reactive, watch,
} from 'vue';

import {
    PButton, PSidebar, PButtonModal, PI,
} from '@spaceone/design-system';

import getRandomId from '@/lib/random-id-generator';

import ErrorHandler from '@/common/composables/error/errorHandler';

import DashboardWidgetForm
    from '@/services/dashboards/components/DashboardWidgetForm.vue';
import { useDashboardDetailInfoStore } from '@/services/dashboards/stores/dashboard-detail-info-store';
import { useWidgetFormStore } from '@/services/dashboards/stores/widget-form-store';
import { getNonInheritedWidgetOptionsAmongUsedVariables } from '@/services/dashboards/widgets/_helpers/widget-schema-helper';
import type { UpdatableWidgetInfo } from '@/services/dashboards/widgets/_types/widget-type';


interface Props {
    widgetKey?: string;
    widgetConfigId?: string;
    visible?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    widgetKey: undefined,
    widgetConfigId: undefined,
});
const emit = defineEmits<{(e: 'close', save: boolean): void;
    (e: 'update:widget-info', widgetInfo: UpdatableWidgetInfo): void;
    (e: 'update:has-non-inherited-widget-options', value: boolean): void;
}>();

const dashboardDetailStore = useDashboardDetailInfoStore();
const dashboardDetailState = dashboardDetailStore.state;
const widgetFormStore = useWidgetFormStore();
const widgetFormState = widgetFormStore.state;
const widgetFormGetters = widgetFormStore.getters;

const state = reactive({
    nonInheritedOptionModalVisible: false,
    hasNonInheritedWidgetOptions: computed<boolean>(() => {
        const nonInheritedWidgetOptions = getNonInheritedWidgetOptionsAmongUsedVariables(
            dashboardDetailState.variablesSchema,
            widgetFormState.inheritOptions,
            widgetFormState.schemaProperties,
        );
        return nonInheritedWidgetOptions.length > 0;
    }),
    contextKey: getRandomId(),
});

/* Util */
const updateDashboardWidgetStore = () => {
    // update widget info in dashboard detail store
    if (widgetFormGetters.updatedWidgetInfo) dashboardDetailStore.updateWidgetInfo(props.widgetKey, widgetFormGetters.updatedWidgetInfo);
};

/* Api */
const updateWidgetInfo = async () => {
    try {
        await dashboardDetailStore.updateDashboard(dashboardDetailState.dashboardId as string, {
            layouts: [dashboardDetailState.dashboardWidgetInfoList],
        });
    } catch (e) {
        ErrorHandler.handleError(e);
    }
};

/* Event */
const handleClickSaveButton = async () => {
    if (state.hasNonInheritedWidgetOptions && !state.nonInheritedOptionModalVisible) {
        state.nonInheritedOptionModalVisible = true;
        return;
    }
    updateDashboardWidgetStore();
    await updateWidgetInfo();
    state.nonInheritedOptionModalVisible = false;
    emit('close', true);
};
const handleCloseSidebar = () => {
    emit('close', false);
};


watch(() => state.hasNonInheritedWidgetOptions, (value) => {
    emit('update:has-non-inherited-widget-options', value);
}, { immediate: true });

watch([() => props.visible, () => dashboardDetailState.variables], ([visible]) => {
    if (visible) {
        state.contextKey = getRandomId();
    }
});

watch([() => widgetFormGetters.updatedWidgetInfo, () => widgetFormGetters.isAllOptionsInitiated], ([widgetInfo, isAllInit]) => {
    if (!isAllInit) return;
    if (widgetInfo === undefined) return;
    if (!props.visible) return;

    emit('update:widget-info', widgetInfo as UpdatableWidgetInfo);
});
</script>

<template>
    <transition name="slide-left">
        <div class="widget-view-mode-sidebar">
            <p-sidebar :visible="true"
                       style-type="primary"
                       size="md"
                       is-fixed-size
                       hide-close-button
                       @close="handleCloseSidebar"
            >
                <main class="main">
                    <slot />
                </main>
                <template #title>
                    <span class="sidebar-title">{{ $t('DASHBOARDS.FULL_SCREEN_VIEW.EDIT_WIDGET_OPTION') }}</span> <br>
                </template>
                <template #sidebar>
                    <div class="sidebar-contents">
                        <dashboard-widget-form :key="state.contextKey"
                                               :widget-config-id="props.widgetConfigId"
                                               :widget-key="props.widgetKey"
                        />
                    </div>
                </template>
                <template #footer>
                    <div class="footer-wrapper">
                        <p-button style-type="transparent"
                                  @click="handleCloseSidebar"
                        >
                            {{ $t('DASHBOARDS.FULL_SCREEN_VIEW.CANCEL') }}
                        </p-button>
                        <p-button style-type="primary"
                                  :disabled="!widgetFormGetters.isAllValid"
                                  @click="handleClickSaveButton"
                        >
                            {{ $t('DASHBOARDS.FULL_SCREEN_VIEW.SAVE') }}
                        </p-button>
                    </div>
                </template>
            </p-sidebar>
            <p-button-modal :visible.sync="state.nonInheritedOptionModalVisible"
                            :header-title="$t('DASHBOARDS.FULL_SCREEN_VIEW.NON_INHERITED_OPTIONS_INCLUDED')"
                            size="sm"
                            @confirm="handleClickSaveButton"
            >
                <template #body>
                    <div class="non-inherited-option-modal-body">
                        <p>
                            <p-i name="ic_warning-filled"
                                 color="inherit"
                                 width="1rem"
                                 height="1rem"
                                 class="warning-icon"
                            />
                            <span>{{ $t('DASHBOARDS.FULL_SCREEN_VIEW.APPLY_NON_INHERITED_OPTION_HELP_TEXT') }}</span>
                        </p>
                    </div>
                </template>
            </p-button-modal>
        </div>
    </transition>
</template>

<style lang="postcss" scoped>
.widget-view-mode-sidebar {
    position: absolute;
    width: 20rem;
    top: 0;
    right: 0;
    z-index: 10;

    .sidebar-title {
        @apply text-label-xl;
    }

    .sidebar-contents {
        position: relative;
        gap: 1.5rem;
        font-size: 0.875rem;
        line-height: 125%;
    }
    .footer-wrapper {
        @apply grid grid-cols-12 border-t border-gray-200;
        position: absolute;
        bottom: 0;
        width: 100%;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        button {
            @apply col-span-6;
        }
    }
    .non-inherited-option-modal-body {
        .warning-icon {
            margin-right: 0.25rem;
        }
    }
}

$footer-height: 57px;

/* custom design-system component - p-sidebar */
:deep(.p-sidebar) {
    .sidebar-wrapper {
        height: 100%;
        padding-top: 0;
        padding-bottom: $footer-height;
        .inner {
            padding-top: 2rem;
            padding-bottom: 1rem;
        }
    }
}

/* transition */
.slide-up-enter-active {
    transition: all 0.3s ease;
}
.slide-up-leave-active {
    transition: all 0.3s ease-out;
}
.slide-up-enter, .slide-up-leave-to {
    transform: translateY(100px);
    opacity: 0;
}
.slide-left-leave-active,
.slide-left-enter-active {
    transition: all 0.3s ease;
}
.slide-left-enter {
    transform: translate(100%, 0);
}
.slide-left-leave {
    transform: translate(0, 0);
}
.slide-left-leave-to {
    transform: translate(100%, 0);
}
.slide-left-enter-to {
    transform: translate(0, 0);
}
</style>
