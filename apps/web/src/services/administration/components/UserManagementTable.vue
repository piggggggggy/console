<script lang="ts" setup>
import {
    computed, reactive,
} from 'vue';

import {
    PBadge, PStatus, PToolboxTable, PButton, PSelectDropdown, PTooltip,
} from '@spaceone/design-system';
import type { DefinitionField } from '@spaceone/design-system/src/data-display/tables/definition-table/type';
import type { SelectDropdownMenuItem, AutocompleteHandler } from '@spaceone/design-system/types/inputs/dropdown/select-dropdown/type';

import { getApiQueryWithToolboxOptions } from '@cloudforet/core-lib/component-util/toolbox';
import { SpaceConnector } from '@cloudforet/core-lib/space-connector';
import { ApiQueryHelper } from '@cloudforet/core-lib/space-connector/helper';

import type { RoleUpdateParameters } from '@/schema/identity/role-binding/api-verbs/update';
import type { RoleBindingModel } from '@/schema/identity/role-binding/model';
import { ROLE_TYPE } from '@/schema/identity/role/constant';
import { store } from '@/store';
import { i18n } from '@/translations';

import { showErrorMessage, showSuccessMessage } from '@/lib/helper/notice-alert-helper';

import ErrorHandler from '@/common/composables/error/errorHandler';
import { useQueryTags } from '@/common/composables/query-tags';

import UserManagementTableToolbox from '@/services/administration/components/UserManagementTableToolbox.vue';
import {
    calculateTime, userStateFormatter, useRoleFormatter, userMfaFormatter,
} from '@/services/administration/composables/refined-table-data';
import { USER_SEARCH_HANDLERS } from '@/services/administration/constants/user-constant';
import { useUserPageStore } from '@/services/administration/store/user-page-store';

interface Props {
    tableHeight: number;
}

const props = withDefaults(defineProps<Props>(), {
    tableHeight: 400,
});

const userPageStore = useUserPageStore();
const userPageState = userPageStore.$state;

const emit = defineEmits<{(e: 'confirm'): void; }>();

const roleListApiQueryHelper = new ApiQueryHelper();
const userListApiQueryHelper = new ApiQueryHelper()
    .setPageStart(userPageState.pageStart).setPageLimit(userPageState.pageLimit)
    .setSort('name', true);
let userListApiQuery = userListApiQueryHelper.data;
const queryTagHelper = useQueryTags({ keyItemSets: USER_SEARCH_HANDLERS.keyItemSets });
const { queryTags } = queryTagHelper;

const storeState = reactive({
    loginUserId: computed(() => store.state.user.userId),
});
const state = reactive({
    refinedUserItems: computed(() => userPageState.users.map((user) => ({
        ...user,
        api_key_count: user?.api_key_count ?? 0,
        mfa: user?.mfa?.state === 'ENABLED' ? 'ON' : 'OFF',
        last_accessed_at: calculateTime(user?.last_accessed_at, userPageStore.timezone),
    }))),
});
const tableState = reactive({
    userTableFields: computed(() => {
        const additionalFields: DefinitionField[] = [];
        if (userPageState.isAdminMode) {
            additionalFields.push(
                { name: 'mfa', label: 'Multi-factor Auth' },
                { name: 'api_key_count', label: 'API Key', sortable: false },
                { name: 'role_type', label: 'Role Type' },
            );
        } else {
            additionalFields.push(
                { name: 'role_binding', label: 'Role', sortable: false },
            );
        }
        const baseFields = [
            { name: 'user_id', label: 'User ID' },
            { name: 'name', label: 'Name' },
            { name: 'state', label: 'State' },
            ...additionalFields,
            { name: 'tags', label: 'Tags', sortable: false },
            { name: 'auth_type', label: 'Auth Type' },
            { name: 'last_accessed_at', label: 'Last Activity' },
            { name: 'timezone', label: 'Timezone' },
        ];
        return userPageStore.isWorkspaceOwner
            ? [
                ...baseFields,
                { name: 'remove_button', label: ' ', sortable: false },
            ]
            : baseFields;
    }),
});
const dropdownState = reactive({
    loading: false,
    visibleMenu: false,
    searchText: '',
    selectedItems: [] as SelectDropdownMenuItem[],
    menuItems: [] as SelectDropdownMenuItem[],
});

/* Component */
const handleSelect = async (index) => {
    userPageStore.$patch({ selectedIndices: index });
};
/* API */
const dropdownMenuHandler: AutocompleteHandler = async (inputText: string) => {
    dropdownState.loading = true;

    roleListApiQueryHelper.setFilters([{
        k: 'role_type',
        v: [ROLE_TYPE.WORKSPACE_OWNER, ROLE_TYPE.WORKSPACE_MEMBER],
        o: '=',
    }]);
    if (inputText) {
        roleListApiQueryHelper.addFilter({
            k: 'name',
            v: inputText,
            o: '',
        });
    }
    try {
        const results = await userPageStore.listRoles({
            query: roleListApiQueryHelper.data,
        });
        dropdownState.menuItems = (results ?? []).map((role) => ({
            label: role.name,
            name: role.role_id,
            role_type: role.role_type,
        }));
    } catch (e) {
        ErrorHandler.handleError(e);
    } finally {
        dropdownState.loading = false;
    }

    return {
        results: dropdownState.menuItems,
    };
};
const handleSelectDropdownItem = async (value, rowIndex) => {
    try {
        await SpaceConnector.clientV2.identity.roleBinding.updateRole<RoleUpdateParameters, RoleBindingModel>({
            role_binding_id: state.refinedUserItems[rowIndex].role_binding_info?.role_binding_id || '',
            role_id: value.name || '',
        });
        showSuccessMessage(i18n.t('IAM.USER.MAIN.ALT_S_CHANGE_ROLE'), '');
        emit('confirm');
    } catch (e: any) {
        ErrorHandler.handleRequestError(e, e.message);
    }
};
const handleChange = async (options: any = {}) => {
    userListApiQuery = getApiQueryWithToolboxOptions(userListApiQueryHelper, options) ?? userListApiQuery;
    if (options.queryTags !== undefined) {
        userPageStore.$patch((_state) => {
            _state.searchFilters = userListApiQueryHelper.filters;
        });
    }
    if (options.pageStart !== undefined) userPageStore.$patch({ pageStart: options.pageStart });
    if (options.pageLimit !== undefined) userPageStore.$patch({ pageLimit: options.pageLimit });
    if (userPageState.isAdminMode) {
        await userPageStore.listUsers({ query: userListApiQuery });
    } else {
        await userPageStore.listWorkspaceUsers({ query: userListApiQuery });
    }
};
const handleClickButton = async (value: RoleBindingModel) => {
    try {
        await SpaceConnector.clientV2.identity.roleBinding.delete({
            role_binding_id: value.role_binding_id,
        });
        showSuccessMessage(i18n.t('IDENTITY.USER.MAIN.ALT_S_REMOVE_USER'), '');
        emit('confirm');
    } catch (e) {
        showErrorMessage(i18n.t('IDENTITY.USER.MAIN.ALT_E_REMOVE_USER'), '');
        ErrorHandler.handleError(e);
    }
};
</script>

<template>
    <section class="user-management-table">
        <p-toolbox-table
            search-type="query"
            searchable
            selectable
            sortable
            :loading="userPageState.loading"
            :items="state.refinedUserItems"
            :select-index="userPageState.selectedIndices"
            :fields="tableState.userTableFields"
            sort-by="name"
            :sort-desc="true"
            :total-count="userPageState.totalCount"
            :key-item-sets="USER_SEARCH_HANDLERS.keyItemSets"
            :value-handler-map="USER_SEARCH_HANDLERS.valueHandlerMap"
            :query-tags="queryTags"
            :style="{height: `${props.tableHeight}px`}"
            @select="handleSelect"
            @change="handleChange"
            @refresh="handleChange()"
        >
            <template #toolbox-left>
                <user-management-table-toolbox v-if="userPageState.isAdminMode" />
            </template>
            <template #col-state-format="{value}">
                <p-status v-bind="userStateFormatter(value)"
                          class="capitalize"
                />
            </template>
            <template #col-role_type-format="{value}">
                <div class="role-type-wrapper">
                    <img :src="useRoleFormatter(value).image"
                         alt="role-type-icon"
                         class="role-type-icon"
                    >
                    <span>{{ useRoleFormatter(value).name }}</span>
                </div>
            </template>
            <template #col-role_binding-format="{value, rowIndex}">
                <div class="role-type-wrapper">
                    <p-tooltip position="bottom"
                               :contents="useRoleFormatter(value.type).name"
                               class="tooltip"
                    >
                        <img :src="useRoleFormatter(value.type).image"
                             alt="role-type-icon"
                             class="role-type-icon"
                        >
                    </p-tooltip>
                    <span>{{ value.name }}</span>
                    <p-select-dropdown v-if="userPageStore.isWorkspaceOwner && state.refinedUserItems[rowIndex].user_id !== storeState.loginUserId"
                                       is-filterable
                                       use-fixed-menu-style
                                       menu-position="right"
                                       style-type="icon-button"
                                       :visible-menu="dropdownState.visibleMenu"
                                       :loading="dropdownState.loading"
                                       :search-text.sync="dropdownState.searchText"
                                       :selected="dropdownState.selectedItems"
                                       :handler="dropdownMenuHandler"
                                       class="role-select-dropdown"
                                       @select="handleSelectDropdownItem($event, rowIndex)"
                    >
                        <template #menu-item--format="{item}">
                            <div class="role-menu-item">
                                <img :src="useRoleFormatter(item.role_type).image"
                                     alt="role-type-icon"
                                     class="role-type-icon"
                                >
                                <div class="role-info-wrapper">
                                    <span>{{ item.label }}</span>
                                    <span class="role-type">({{ item.role_type }})</span>
                                </div>
                            </div>
                        </template>
                    </p-select-dropdown>
                </div>
            </template>
            <template #col-mfa-format="{value}">
                <p-status v-bind="userMfaFormatter(value)"
                          class="capitalize"
                />
            </template>
            <template #col-last_accessed_at-format="{ value }">
                <span v-if="value === -1">
                    No Activity
                </span>
                <span v-else-if="value === 0">
                    {{ $t('IAM.USER.MAIN.TODAY') }}
                </span>
                <span v-else-if="value === 1">
                    {{ $t('IAM.USER.MAIN.YESTERDAY') }}
                </span>
                <span v-else>
                    {{ value }} {{ $t('IAM.USER.MAIN.DAYS') }}
                </span>
            </template>
            <template #col-tags-format="{value}">
                <template v-if="!!Object.keys(value).length">
                    <p-badge v-for="([key, val], idx) in Object.entries(value)"
                             :key="`${key}-${val}-${idx}`"
                             badge-type="subtle"
                             shape="square"
                             style-type="gray200"
                             class="mr-2"
                    >
                        {{ key }}: {{ val }}
                    </p-badge>
                </template>
                <template v-else>
                    <span />
                </template>
            </template>
            <template #col-remove_button-format="value">
                <p-button style-type="tertiary"
                          size="sm"
                          class="remove-button"
                          @click="handleClickButton(value.role_binding_info.role_binding_id)"
                >
                    {{ $t('IAM.USER.REMOVE') }}
                </p-button>
            </template>
        </p-toolbox-table>
    </section>
</template>

<style lang="postcss" scoped>
.user-management-table {
    .role-type-wrapper {
        @apply flex items-center;
        gap: 0.25rem;
        .tooltip {
            @apply rounded-full;
            width: 1.5rem;
            height: 1.5rem;
            margin-right: 0.25rem;
        }
        .role-type-icon {
            @apply rounded-full;
            width: 1.5rem;
            height: 1.5rem;
        }
        .role-select-dropdown {
            width: auto;
            .role-menu-item {
                @apply flex items-center;
                gap: 0.25rem;
                .role-type-icon {
                    width: 1rem;
                    height: 1rem;
                }
                .role-info-wrapper {
                    @apply flex flex-col;
                    gap: 0.25rem;
                    .role-type {
                        @apply text-gray-500;
                    }
                }
            }
        }
    }
}
</style>
