import type { ComputedRef } from 'vue';
import { computed, reactive } from 'vue';

import { defineStore } from 'pinia';

import { SpaceConnector } from '@cloudforet/core-lib/space-connector';

import type { ListResponse } from '@/schema/_common/api-verbs/list';
import type { NotificationProtocolListParameters } from '@/schema/alert-manager/notification-protocol/api-verbs/list';
import type { NotificationProtocolModel } from '@/schema/alert-manager/notification-protocol/model';
import type { ServiceDeleteParameters } from '@/schema/alert-manager/service/api-verbs/delete';
import type { ServiceGetParameters } from '@/schema/alert-manager/service/api-verbs/get';
import type { ServiceUpdateParameters } from '@/schema/alert-manager/service/api-verbs/update';
import { NOTIFICATION_URGENCY, RECOVERY_MODE, SERVICE_ALERTS_TYPE } from '@/schema/alert-manager/service/constants';
import type { ServiceModel } from '@/schema/alert-manager/service/model';
import type { AlertsInfoType, AlertsType } from '@/schema/alert-manager/service/type';
import { i18n } from '@/translations';

import { useAllReferenceStore } from '@/store/reference/all-reference-store';
import type { PluginReferenceMap } from '@/store/reference/plugin-reference-store';
import type { ServiceReferenceMap } from '@/store/reference/service-reference-store';
import type { UserGroupReferenceMap } from '@/store/reference/user-group-reference-store';
import type { UserReferenceMap } from '@/store/reference/user-reference-store';
import { useUserStore } from '@/store/user/user-store';

import { showSuccessMessage } from '@/lib/helper/notice-alert-helper';

import ErrorHandler from '@/common/composables/error/errorHandler';

import { SERVICE_DETAIL_TABS } from '@/services/alert-manager/constants/common-constant';
import type { ServiceDetailTabsType, Service, ProtocolCardItemType } from '@/services/alert-manager/types/alert-manager-type';

interface ServiceFormStoreState {
    loading: boolean;
    currentTab: ServiceDetailTabsType;
    serviceInfo: ServiceModel;
    notificationProtocolList: ProtocolCardItemType[];
    selectedWebhookId?: string;
    selectedNotificationId?: string;
}
interface ServiceFormStoreGetters {
    serviceInfo: ComputedRef<Service>;
    pluginsReferenceMap: ComputedRef<PluginReferenceMap>;
    userGroupReferenceMap: ComputedRef<UserGroupReferenceMap>;
    userReferenceMap: ComputedRef<UserReferenceMap>;
    serviceReferenceMap: ComputedRef<ServiceReferenceMap>;
    timezone: ComputedRef<string>;
    language: ComputedRef<string>;
}

export const useServiceDetailPageStore = defineStore('page-service-detail', () => {
    const allReferenceStore = useAllReferenceStore();
    const allReferenceGetters = allReferenceStore.getters;
    const userStore = useUserStore();
    const userState = userStore.state;

    const state = reactive<ServiceFormStoreState>({
        loading: false,
        currentTab: SERVICE_DETAIL_TABS.OVERVIEW,
        serviceInfo: {} as ServiceModel,
        notificationProtocolList: [],
        selectedWebhookId: undefined,
        selectedNotificationId: undefined,
    });

    const getters = reactive<ServiceFormStoreGetters>({
        serviceInfo: computed(() => {
            const getAlerts = (alertKey: AlertsType): AlertsInfoType => {
                const alertValue = state.serviceInfo.alerts?.[alertKey] || { HIGH: 0, LOW: 0 };
                return {
                    HIGH: alertValue.HIGH || 0,
                    LOW: alertValue.LOW || 0,
                };
            };
            return {
                ...state.serviceInfo,
                members: {
                    USER_GROUP: state.serviceInfo.members?.USER_GROUP || [],
                    USER: state.serviceInfo.members?.USER || [],
                },
                options: {
                    notification_urgency: state.serviceInfo.options?.notification_urgency || NOTIFICATION_URGENCY.ALL,
                    recovery_mode: state.serviceInfo.options?.recovery_mode || RECOVERY_MODE.MANUAL,
                },
                alerts: {
                    TRIGGERED: getAlerts(SERVICE_ALERTS_TYPE.TRIGGERED),
                    ACKNOWLEDGED: getAlerts(SERVICE_ALERTS_TYPE.ACKNOWLEDGED),
                    RESOLVED: getAlerts(SERVICE_ALERTS_TYPE.RESOLVED),
                    TOTAL: getAlerts(SERVICE_ALERTS_TYPE.TOTAL),
                },
            };
        }),
        pluginsReferenceMap: computed(() => allReferenceGetters.plugin),
        userGroupReferenceMap: computed(() => allReferenceGetters.user_group),
        userReferenceMap: computed(() => allReferenceGetters.user),
        serviceReferenceMap: computed(() => allReferenceGetters.service),
        timezone: computed(() => userState.timezone || 'UTC'),
        language: computed(() => userStore.state.language || 'en'),
    });

    const mutations = {
        setCurrentTab(currentTab: ServiceDetailTabsType) {
            state.currentTab = currentTab;
        },
        setSelectedWebhookId(id?: string) {
            state.selectedWebhookId = id;
        },
        setSelectedNotificationId(id?: string) {
            state.selectedNotificationId = id;
        },
    };

    const actions = {
        initState() {
            state.loading = false;
            state.currentTab = SERVICE_DETAIL_TABS.OVERVIEW;
            state.serviceInfo = {} as ServiceModel;
            state.notificationProtocolList = [];
            state.selectedWebhookId = undefined;
            state.selectedNotificationId = undefined;
        },
        async fetchServiceDetailData(id: string) {
            state.loading = true;
            try {
                state.serviceInfo = await SpaceConnector.clientV2.alertManager.service.get<ServiceGetParameters, ServiceModel>({
                    service_id: id,
                    details: true,
                });
            } catch (e) {
                ErrorHandler.handleError(e);
                state.serviceInfo = {} as ServiceModel;
                throw e;
            } finally {
                state.loading = false;
            }
        },
        async updateServiceDetailData({ name, description }: { name: string, description: string }) {
            try {
                state.serviceInfo = await SpaceConnector.clientV2.alertManager.service.update<ServiceUpdateParameters, ServiceModel>({
                    service_id: getters.serviceInfo.service_id,
                    name,
                    description,
                });
                showSuccessMessage(i18n.t('ALERT_MANAGER.SERVICE.ALT_S_UPDATE_SERVICE'), '');
                await allReferenceStore.sync('service', state.serviceInfo);
            } catch (e) {
                ErrorHandler.handleError(e, true);
                state.serviceInfo = {} as ServiceModel;
            }
        },
        async deleteServiceDetailData() {
            try {
                await SpaceConnector.clientV2.alertManager.service.delete<ServiceDeleteParameters>({
                    service_id: getters.serviceInfo.service_id,
                });
            } catch (e) {
                ErrorHandler.handleError(e, true);
                throw e;
            }
        },
        async fetchNotificationProtocolList() {
            try {
                const { results } = await SpaceConnector.clientV2.alertManager.notificationProtocol.list<NotificationProtocolListParameters, ListResponse<NotificationProtocolModel>>();
                state.notificationProtocolList = (results || []).map((i) => ({
                    ...i,
                    icon: getters.pluginsReferenceMap[i.plugin_info.plugin_id || '']?.icon || '',
                }));
            } catch (e) {
                ErrorHandler.handleError(e);
                state.notificationProtocolList = [];
            }
        },
    };

    return {
        state,
        getters,
        ...mutations,
        ...actions,
    };
});
