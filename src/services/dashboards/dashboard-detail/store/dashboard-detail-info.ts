import type { ComputedRef, UnwrapRef } from 'vue';
import {
    computed, reactive,
} from 'vue';

import dayjs from 'dayjs';
import { cloneDeep, flattenDeep } from 'lodash';
import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';

import { SpaceConnector } from '@cloudforet/core-lib/space-connector';


import { store } from '@/store';

import type { Currency } from '@/store/modules/display/config';
import { CURRENCY } from '@/store/modules/display/config';

import type {
    DateRange, DashboardViewer, DashboardSettings, DashboardVariables, DashboardVariablesSchema,
} from '@/services/dashboards/config';
import { DASHBOARD_VIEWER } from '@/services/dashboards/config';
import type { DashboardContainerWidgetInfo } from '@/services/dashboards/dashboard-detail/lib/type';
import type { DashboardModel, ProjectDashboardModel } from '@/services/dashboards/model';
import { WIDGET_SIZE } from '@/services/dashboards/widgets/_configs/config';
import { getWidgetConfig } from '@/services/dashboards/widgets/_helpers/widget-helper';

interface WidgetDataMap {
    [widgetKey: string]: any;
}

interface DashboardDetailInfoStoreState {
    loadingDashboard: boolean;
    dashboardId: string | undefined;
    projectId: string;
    isProjectDashboard: ComputedRef<boolean>;
    dashboardInfo: DashboardModel|null;
    dashboardViewer: ComputedRef<DashboardViewer>;
    dashboardName: string;
    enableCurrency: boolean;
    currency: Currency;
    enableDateRange: boolean;
    dateRange: DateRange;
    settings: DashboardSettings;
    variables: DashboardVariables;
    variables_schema: DashboardVariablesSchema;
    labels: string[];
    // widget info states
    dashboardWidgetInfoList: DashboardContainerWidgetInfo[];
    loadingWidgets: boolean;
    widgetDataMap: WidgetDataMap;
}

export const useDashboardDetailInfoStore = defineStore('dashboard-detail-info', () => {
    const state = reactive<DashboardDetailInfoStoreState>({
        loadingDashboard: false,
        dashboardId: '',
        projectId: '',
        isProjectDashboard: computed<boolean>(() => {
            if (state.projectId) return true;
            return !!state.dashboardId?.startsWith('project');
        }),
        dashboardViewer: computed<DashboardViewer>(() => state.dashboardInfo?.viewers ?? DASHBOARD_VIEWER.PRIVATE),
        dashboardInfo: null,
        dashboardName: '',
        enableCurrency: false,
        currency: CURRENCY.USD,
        enableDateRange: false,
        dateRange: {
            start: dayjs.utc().format('YYYY-MM-01'),
            end: dayjs.utc().format('YYYY-MM-DD'),
        },
        settings: {
            date_range: {
                enabled: false,
                start: dayjs.utc().format('YYYY-MM-01'),
                end: dayjs.utc().format('YYYY-MM-DD'),
            },
            currency: {
                enabled: false,
                value: CURRENCY.USD,
            },
        },
        // TODO: temporary data
        variables: {
            project: ['test2', 'test3'],
            // serviceAccount: 'test4', // undefined case
            // provider: ['test1', 'test4'], // undefined case
            user: ['test4'],
            region: ['test3'],
            randomkeynode: 'test1',
            randomkeynode2: 'test5555',
        },
        variables_schema: {
            properties: {
                project: {
                    variable_type: 'MANAGED',
                    use: true,
                    selection_type: 'MULTI',
                    options: ['test1', 'test2', 'test3', 'test4'],
                    name: 'Project',
                },
                serviceAccount: {
                    variable_type: 'MANAGED',
                    use: true,
                    selection_type: 'SINGLE',
                    options: ['test1', 'test2', 'test3', 'test4'],
                    name: 'Service Account',
                },
                provider: {
                    variable_type: 'MANAGED',
                    use: true,
                    selection_type: 'MULTI',
                    options: ['1', '2', '3', '4'],
                    name: 'Provider',
                },
                user: {
                    variable_type: 'MANAGED',
                    use: false,
                    selection_type: 'MULTI',
                    options: ['test1', 'test2', 'test3', 'test4'],
                    name: 'User',
                },
                region: {
                    variable_type: 'MANAGED',
                    use: false,
                    selection_type: 'MULTI',
                    options: ['test1', 'test2', 'test3', 'test4'],
                    name: 'Region',
                },
                randomkeynode: {
                    variable_type: 'CUSTOM',
                    use: true,
                    selection_type: 'MULTI',
                    options: ['test1', 'test2', 'test3', 'test4'],
                    name: 'Node',
                },
                randomkeynode2: {
                    variable_type: 'CUSTOM',
                    use: true,
                    selection_type: 'SINGLE',
                    options: ['test1', 'test2', 'test3', 'test4'],
                    name: 'Node22',
                },
            },
            order: ['project', 'provider', 'serviceAccount', 'region', 'user', 'randomkeynode', 'randomkeynode2'],
        },
        labels: [],
        // widget info states
        dashboardWidgetInfoList: [],
        loadingWidgets: false,
        widgetDataMap: {},
    }) as UnwrapRef<DashboardDetailInfoStoreState>;

    const resetDashboardSettings = () => {
        state.dateRange = {
            start: dayjs.utc().format('YYYY-MM-01'),
            end: dayjs.utc().format('YYYY-MM-DD'),
        };
        state.settings = {
            date_range: {
                enabled: false,
                start: dayjs.utc().format('YYYY-MM-01'),
                end: dayjs.utc().format('YYYY-MM-DD'),
            },
            currency: {
                enabled: false,
                value: CURRENCY.USD,
            },
        };
    };

    const resetDashboardData = () => {
        state.dashboardInfo = null;
        state.dashboardName = '';
        state.projectId = '';
        state.enableCurrency = false;
        state.currency = CURRENCY.USD;
        state.enableDateRange = false;
        state.dateRange = {
            start: dayjs.utc().format('YYYY-MM-01'),
            end: dayjs.utc().format('YYYY-MM-DD'),
        };
        state.settings = {
            date_range: {
                enabled: false,
                start: dayjs.utc().format('YYYY-MM-01'),
                end: dayjs.utc().format('YYYY-MM-DD'),
            },
            currency: {
                enabled: false,
                value: CURRENCY.USD,
            },
        };
        state.variables = {};
        state.variables_schema = { properties: {}, order: [] };
        state.labels = [];
        state.dashboardWidgetInfoList = [];
    };

    const setDashboardInfo = (dashboardInfo: DashboardModel) => {
        state.dashboardInfo = dashboardInfo;
        state.dashboardName = dashboardInfo.name;
        state.projectId = (dashboardInfo as ProjectDashboardModel).project_id ?? '';

        state.enableCurrency = dashboardInfo.settings?.currency?.enabled ?? false;
        state.currency = dashboardInfo.settings.currency?.value ?? CURRENCY.USD;
        state.enableDateRange = dashboardInfo.settings?.date_range?.enabled ?? false;
        state.dateRange = dashboardInfo.settings.date_range;
        state.settings = {
            date_range: {
                enabled: dashboardInfo.settings?.date_range?.enabled ?? false,
                start: dashboardInfo.settings?.date_range?.start,
                end: dashboardInfo.settings?.date_range?.end,
            },
            currency: {
                enabled: dashboardInfo.settings?.currency?.enabled ?? false,
                value: dashboardInfo.settings.currency?.value ?? CURRENCY.USD,
            },
        };
        // TODO: temporary code
        // state.variables_schema = dashboardInfo.variables_schema;
        // state.variables = dashboardInfo.variables ?? {};
        state.labels = dashboardInfo.labels;
        state.dashboardWidgetInfoList = flattenDeep(dashboardInfo?.layouts ?? []).map((info) => ({
            ...info,
            widgetKey: uuidv4(),
        }));
        state.widgetDataMap = {};
    };

    const setVariables = (variables: DashboardVariables) => {
        state.variables = variables;
    };
    const setVariablesSchema = (variablesSchema: DashboardVariablesSchema) => {
        state.variables_schema = variablesSchema;
    };

    const getDashboardData = async (dashboardId?: string) => {
        if (dashboardId === state.dashboardId || dashboardId === undefined) return;

        state.dashboardId = dashboardId;
        state.loadingDashboard = true;
        try {
            let result: DashboardModel;
            if (state.isProjectDashboard) {
                result = await SpaceConnector.clientV2.dashboard.projectDashboard.get({ project_dashboard_id: state.dashboardId });
            } else {
                result = await SpaceConnector.clientV2.dashboard.domainDashboard.get({ domain_dashboard_id: state.dashboardId });
            }
            setDashboardInfo(result);
        } catch (e) {
            resetDashboardData();
            throw e;
        } finally {
            state.loadingDashboard = false;
        }
    };

    const toggleWidgetSize = (widgetKey: string) => {
        state.dashboardWidgetInfoList = state.dashboardWidgetInfoList.map((info) => {
            const widgetSizes = getWidgetConfig(info.widget_name)?.sizes;
            if (info.widgetKey === widgetKey && widgetSizes) {
                return {
                    ...info,
                    size: (info.size === WIDGET_SIZE.full) ? (widgetSizes[0] ?? WIDGET_SIZE.md) : WIDGET_SIZE.full,
                };
            }
            return info;
        });
    };
    const initiateAllWidgets = () => {
        const widgetDataMap = {};
        state.dashboardWidgetInfoList.forEach((widget) => {
            widgetDataMap[widget.widgetKey] = state.widgetDataMap[widget.widgetKey];
        });
        state.widgetDataMap = widgetDataMap;
    };

    const updateWidgetInfo = (widgetKey: string, data: Partial<DashboardContainerWidgetInfo>) => {
        const targetIndex = state.dashboardWidgetInfoList.findIndex((info) => info.widgetKey === widgetKey);
        if (targetIndex > -1) {
            const _dashboardWidgetInfoList = cloneDeep(state.dashboardWidgetInfoList);
            _dashboardWidgetInfoList[targetIndex] = {
                ...state.dashboardWidgetInfoList[targetIndex],
                ...data,
            };
            state.dashboardWidgetInfoList = _dashboardWidgetInfoList;
        }
    };

    const deleteWidget = (widgetKey: string) => {
        state.dashboardWidgetInfoList = state.dashboardWidgetInfoList.filter((info) => info.widgetKey !== widgetKey);
    };

    store.dispatch('reference/loadAll');

    return {
        state,
        getDashboardData,
        resetDashboardSettings,
        setDashboardInfo,
        setVariables,
        setVariablesSchema,
        toggleWidgetSize,
        initiateAllWidgets,
        // getter
        dashboardWidgetInfoList: computed(() => state.dashboardWidgetInfoList),
        // action
        updateWidgetInfo,
        deleteWidget,
    };
});

