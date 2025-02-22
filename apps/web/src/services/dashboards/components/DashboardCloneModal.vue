<script lang="ts" setup>
import {
    computed, reactive, watch,
} from 'vue';

import {
    PButtonModal, PFieldGroup, PRadio, PTextInput, PI,
} from '@spaceone/design-system';

import { SpaceRouter } from '@/router';
import { RESOURCE_GROUP } from '@/schema/_common/constant';
import { DASHBOARD_TYPE } from '@/schema/dashboard/_constants/dashboard-constant';
import type {
    DashboardType,
} from '@/schema/dashboard/_types/dashboard-type';
import { store } from '@/store';
import { i18n } from '@/translations';

import { useAppContextStore } from '@/store/app-context/app-context-store';
import { useDashboardStore } from '@/store/dashboard/dashboard-store';

import ErrorHandler from '@/common/composables/error/errorHandler';
import { useFormValidator } from '@/common/composables/form-validator';
import { useProxyValue } from '@/common/composables/proxy-state';

import { gray } from '@/styles/colors';

import { DASHBOARDS_ROUTE } from '@/services/dashboards/routes/route-constant';
import { useDashboardDetailInfoStore } from '@/services/dashboards/stores/dashboard-detail-info-store';
import type { CreateDashboardParameters, DashboardModel } from '@/services/dashboards/types/dashboard-api-schema-type';


interface Props {
    visible?: boolean;
    dashboard?: DashboardModel;
    manageDisabled?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
    visible: false,
    dashboard: () => ({}),
    manageDisabled: false,
});
const emit = defineEmits<{(e: 'update:visible', value: boolean): void;
}>();

const appContextStore = useAppContextStore();
const dashboardStore = useDashboardStore();
const dashboardGetters = dashboardStore.getters;
const dashboardDetailStore = useDashboardDetailInfoStore();

const {
    forms: {
        name,
    },
    setForm,
    initForm,
    invalidState,
    invalidTexts,
    isAllValid,
} = useFormValidator({
    name: '',
}, {
    name(value: string) {
        if (value.length > 100) return i18n.t('DASHBOARDS.FORM.VALIDATION_DASHBOARD_NAME_LENGTH');
        if (!value.trim().length) return i18n.t('DASHBOARDS.FORM.VALIDATION_DASHBOARD_NAME_INPUT');
        if (state.dashboardNameList.find((d) => d === value)) return i18n.t('DASHBOARDS.FORM.VALIDATION_DASHBOARD_NAME_UNIQUE');
        return '';
    },
});
const storeState = reactive({
    isAdminMode: computed(() => appContextStore.getters.isAdminMode),
});
const state = reactive({
    proxyVisible: useProxyValue('visible', props, emit),
    dashboardType: 'PRIVATE' as DashboardType,
    filteredVisibilityList: computed(() => [
        { name: 'PRIVATE', label: i18n.t('DASHBOARDS.FORM.LABEL_PRIVATE'), icon: 'ic_lock-filled' },
        { name: 'PUBLIC', label: i18n.t('DASHBOARDS.FORM.LABEL_PUBLIC') },
    ]),
    projectId: computed<string|undefined>(() => {
        if (props.dashboard?.project_id !== '*') return props.dashboard?.project_id;
        return undefined;
    }),
    dashboardNameList: computed<string[]>(() => {
        if (storeState.isAdminMode) return dashboardGetters.domainItems.map((item) => item.name);
        return dashboardStore.getDashboardNameList(state.dashboardType);
    }),
});

const handleUpdateVisible = (visible) => {
    state.proxyVisible = visible;
};

const createDashboard = async () => {
    try {
        const params: CreateDashboardParameters = {
            name: name.value,
            layouts: props.dashboard?.layouts,
            labels: props.dashboard?.labels,
            settings: props.dashboard?.settings,
            variables: props.dashboard?.variables,
            variables_schema: props.dashboard?.variables_schema,
            tags: { created_by: store.state.user.userId },
        };
        if (storeState.isAdminMode) {
            state.dashboardType = DASHBOARD_TYPE.PUBLIC;
            params.resource_group = RESOURCE_GROUP.DOMAIN;
        } else if (state.dashboardType !== 'PRIVATE') {
            params.resource_group = props.dashboard?.resource_group; // workspace, project
            if (props.dashboard?.project_id && props.dashboard?.project_id !== '*') {
                params.project_id = props.dashboard?.project_id;
            }
        }
        const res = await dashboardDetailStore.createDashboard(params, state.dashboardType);
        return res.public_dashboard_id || res.private_dashboard_id;
    } catch (e) {
        ErrorHandler.handleRequestError(e, i18n.t('DASHBOARDS.FORM.ALT_E_CREATE_DASHBOARD'));
    }
    return undefined;
};

const handleChangeDashboardType = (value: DashboardType) => {
    state.dashboardType = value;
};
const handleConfirm = async () => {
    if (!isAllValid) return;
    const clonedDashboardId = await createDashboard();
    state.proxyVisible = false;
    if (clonedDashboardId) {
        await SpaceRouter.router.push({
            name: DASHBOARDS_ROUTE.DETAIL._NAME,
            params: { dashboardId: clonedDashboardId },
        });
    }
};

const init = () => {
    initForm('name', `Clone - ${props.dashboard?.name}`);
};

watch(() => props.visible, (visible) => {
    if (visible !== state.proxyVisible) state.proxyVisible = visible;
    init();
});
</script>

<template>
    <p-button-modal :visible="state.proxyVisible"
                    :header-title="$t('DASHBOARDS.FORM.CLONE_TITLE')"
                    size="sm"
                    :disabled="!isAllValid"
                    class="dashboard-clone-modal"
                    @confirm="handleConfirm"
                    @update:visible="handleUpdateVisible"
    >
        <template #body>
            <p-field-group :label="$t('DASHBOARDS.FORM.LABEL_DASHBOARD_NAME')"
                           :invalid="invalidState.name"
                           :invalid-text="invalidTexts.name"
                           required
            >
                <template #default="{ invalid }">
                    <p-text-input :value="name"
                                  :invalid="invalid"
                                  @update:value="setForm('name', $event)"
                    />
                </template>
            </p-field-group>
            <p-field-group v-if="!storeState.isAdminMode"
                           :label="$t('DASHBOARDS.FORM.LABEL_VIEWERS')"
                           required
                           class="mt-6"
            >
                <p-radio v-for="{ name: visibilityName, label, icon } in state.filteredVisibilityList"
                         :key="visibilityName"
                         :value="visibilityName"
                         :selected="state.dashboardType"
                         class="radio-group"
                         @change="handleChangeDashboardType"
                >
                    <p-i v-if="icon"
                         :name="icon"
                         width="0.875rem"
                         height="0.875rem"
                         :color="gray[500]"
                         class="ml-1"
                    />
                    <span class="ml-1">{{ label }}</span>
                </p-radio>
            </p-field-group>
        </template>
    </p-button-modal>
</template>

<style lang="postcss" scoped>
.dashboard-clone-modal {
    .radio-group {
        @apply inline-block;
        margin-bottom: 0.625rem;
    }
    .p-text-input {
        @apply w-full;
    }
}
</style>
