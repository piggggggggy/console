<script lang="ts" setup>
import type Vue from 'vue';
import { computed, getCurrentInstance, reactive } from 'vue';

import { PI, PTextButton, PDivider } from '@spaceone/design-system';
import { isEqual, xor } from 'lodash';

import { useAllReferenceStore } from '@/store/reference/all-reference-store';

import ErrorHandler from '@/common/composables/error/errorHandler';

import DashboardManageVariableOverlay
    from '@/services/dashboards/components/DashboardManageVariableOverlay.vue';
import DashboardVariableDropdown from '@/services/dashboards/components/DashboardVariableDropdown.vue';
import DashboardVariablesMoreButton
    from '@/services/dashboards/components/DashboardVariablesMoreButton.vue';
import { MANAGE_VARIABLES_HASH_NAME } from '@/services/dashboards/constants/manage-variable-overlay-constant';
import { useDashboardDetailInfoStore } from '@/services/dashboards/stores/dashboard-detail-info-store';
import type { DashboardVariables, DashboardVariablesSchema } from '@/services/dashboards/types/dashboard-model-type';


interface Props {
    isManageable?: boolean;
    disableSaveButton?: boolean;
    originVariables?: DashboardVariables;
    originVariablesSchema?: DashboardVariablesSchema;
    dashboardId?: string;
    disableMoreButton?: boolean;
}

const props = defineProps<Props>();

const dashboardDetailStore = useDashboardDetailInfoStore();
const dashboardDetailState = dashboardDetailStore.state;

const allReferenceStore = useAllReferenceStore();

const vm = getCurrentInstance()?.proxy as Vue;

const state = reactive({
    showOverlay: computed(() => vm.$route.hash === `#${MANAGE_VARIABLES_HASH_NAME}`),
    variableProperties: computed(() => dashboardDetailState.variablesSchema.properties),
    order: computed(() => dashboardDetailState.variablesSchema.order),
    allReferenceTypeInfo: computed(() => allReferenceStore.getters.allReferenceTypeInfo),
    modifiedVariablesSchemaProperties: computed<string[]>(() => {
        if (props.disableSaveButton) return [];
        const results: string[] = [];
        const prevUsedProperties = Object.entries(dashboardDetailState.dashboardInfo?.variables_schema.properties ?? {}).filter(([, v]) => v.use);
        const currUsedProperties = Object.entries(dashboardDetailState.variablesSchema.properties).filter(([, v]) => v.use);
        // check variables changed
        currUsedProperties.forEach(([k]) => {
            if (!isEqual(dashboardDetailState.dashboardInfo?.variables?.[k], dashboardDetailState.variables?.[k])) {
                results.push(k);
            }
        });
        // check schema changed
        results.push(...xor(prevUsedProperties.map(([k]) => k), currUsedProperties.map(([k]) => k)));
        return results;
    }),
    saveLoading: false,
});

const updateDashboardVariables = async () => {
    state.saveLoading = true;
    try {
        await dashboardDetailStore.updateDashboard(props.dashboardId as string, {
            variables: dashboardDetailState.variables,
            variables_schema: dashboardDetailState.variablesSchema,
        });
    } catch (e) {
        ErrorHandler.handleError(e);
    } finally {
        state.saveLoading = false;
    }
};
const handleClickSaveButton = () => {
    updateDashboardVariables();
};
const handleResetVariables = () => {
    dashboardDetailStore.resetVariables(
        props.originVariables ?? dashboardDetailState.dashboardInfo?.variables,
        props.originVariablesSchema ?? dashboardDetailState.dashboardInfo?.variables_schema,
    );
};

</script>

<template>
    <div class="dashboard-variables-select-dropdown">
        <template v-for="(propertyName, idx) in state.order">
            <div v-if="state.variableProperties[propertyName]?.use"
                 :key="`${propertyName}-${idx}`"
                 class="variable-selector-box"
            >
                <dashboard-variable-dropdown :property-name="propertyName"
                                             :reference-map="state.allReferenceTypeInfo[propertyName]?.referenceMap"
                                             :disabled="state.saveLoading"
                />
                <span class="circle-mark"
                      :class="{'changed': state.modifiedVariablesSchemaProperties.includes(propertyName)}"
                />
            </div>
        </template>
        <dashboard-variables-more-button v-if="!props.disableMoreButton"
                                         :is-manageable="props.isManageable"
                                         :disabled="state.saveLoading"
        />
        <p-text-button style-type="highlight"
                       class="reset-button"
                       :disabled="state.saveLoading"
                       @click="handleResetVariables"
        >
            <p-i name="ic_refresh"
                 width="1rem"
                 height="1rem"
                 color="inherit"
            />
            <span>{{ $t('DASHBOARDS.CUSTOMIZE.RESET') }}</span>
        </p-text-button>
        <p-divider v-if="state.modifiedVariablesSchemaProperties.length"
                   :vertical="true"
        />
        <p-text-button v-if="state.modifiedVariablesSchemaProperties.length"
                       style-type="highlight"
                       :loading="state.saveLoading"
                       :disabled="state.saveLoading"
                       @click.stop="handleClickSaveButton"
        >
            {{ $t('DASHBOARDS.CUSTOMIZE.SAVE') }}
        </p-text-button>
        <dashboard-manage-variable-overlay :visible="state.showOverlay" />
    </div>
</template>

<style lang="postcss" scoped>
.dashboard-variables-select-dropdown {
    .variable-selector-box {
        position: relative;
        .circle-mark {
            &.changed {
                @apply bg-secondary1 rounded-xl border-white border-2;
                position: absolute;
                width: 0.75rem;
                height: 0.75rem;
                right: -0.25rem;
                top: -0.25rem;
            }
        }
    }
    .reset-button {
        @apply flex items-center;
        gap: 0.25rem;
    }
    .p-divider {
        &.vertical {
            height: 1rem;
        }
    }
}
</style>
