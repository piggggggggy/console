<script setup lang="ts">
import { onClickOutside } from '@vueuse/core';
import {
    reactive, ref, watch,
} from 'vue';
import type { TranslateResult } from 'vue-i18n';

import {
    PContextMenu, PEmpty, PFieldGroup, PIconButton, PTextInput, PSelectDropdown,
} from '@spaceone/design-system';
import { debounce } from 'lodash';

import { SpaceConnector } from '@cloudforet/core-lib/space-connector';

import type { UserGetParameters } from '@/schema/identity/user/api-verbs/get';
import type { UserModel } from '@/schema/identity/user/model';
import type { AuthType } from '@/schema/identity/user/type';
import type { WorkspaceUserGetParameters } from '@/schema/identity/workspace-user/api-verbs/get';
import type { SummaryWorkspaceUserModel, WorkspaceUserModel } from '@/schema/identity/workspace-user/model';
import { i18n } from '@/translations';

import { USER_MODAL_TYPE } from '@/services/administration/constants/user-constant';
import { checkEmailFormat } from '@/services/administration/helpers/user-management-form-validations';
import { useUserPageStore } from '@/services/administration/store/user-page-store';
import type { AddModalMenuItem } from '@/services/administration/types/user-type';

const userPageStore = useUserPageStore();
const userPageState = userPageStore.$state;

const containerRef = ref<HTMLElement|null>(null);
const contextMenuRef = ref<any|null>(null);
const targetRef = ref<HTMLElement | null>(null);

const emit = defineEmits<{(e: 'change-input', formState): void}>();

const authTypeMenuItem = ref([
    { label: 'Local', name: 'LOCAL' },
]);

const state = reactive({
    loading: false,
    menuVisible: false,
    menuItems: [] as AddModalMenuItem[],
    selectedItems: [] as AddModalMenuItem[],
    independentUsersList: [] as SummaryWorkspaceUserModel[],
});
const authTypeState = reactive({
    selectedUserAuthType: '' as AuthType,
    selectedMenuItem: authTypeMenuItem.value[0].name as AuthType,
});
const formState = reactive({
    searchText: '',
});
const validationState = reactive({
    userIdInvalid: undefined as undefined | boolean,
    userIdInvalidText: '' as TranslateResult,
});

/* Component */
const hideMenu = () => {
    emit('change-input', { userList: state.selectedItems });
    state.menuVisible = false;
};
const handleClickTextInput = async () => {
    state.menuVisible = true;
    validationState.userIdInvalid = false;
    validationState.userIdInvalidText = '';
};
const handleChangeTextInput = debounce(async (searchText: string) => {
    formState.searchText = searchText;
    validationState.userIdInvalid = false;
    validationState.userIdInvalidText = '';
    if (!userPageState.isAdminMode) {
        await fetchListUsers();
    }
}, 200);
const handleEnterTextInput = () => {
    if (formState.searchText === '') return;
    const { isValid, invalidText } = checkEmailFormat(formState.searchText);
    const isExistUser = state.selectedItems.some((item) => item.user_id === formState.searchText);
    if (!isValid) {
        validationState.userIdInvalid = true;
        validationState.userIdInvalidText = invalidText;
        hideMenu();
    } else if (isExistUser) {
        formState.searchText = '';
        hideMenu();
    } else {
        getUserList();
    }
};
const handleClickDeleteButton = (idx: number) => {
    state.selectedItems.splice(idx, 1);
    emit('change-input', { userList: state.selectedItems });
};
const handleSelectAuthTypeItem = (selected: string, idx: number) => {
    state.selectedItems[idx].auth_type = selected as AuthType;
    handleSelectDropdownItem(selected);
    emit('change-input', { userList: state.selectedItems });
};
const handleSelectDropdownItem = (selected: string) => {
    authTypeState.selectedMenuItem = selected as AuthType;
};
const getUserList = async () => {
    let isNew = userPageState.isAdminMode;
    try {
        if (userPageState.isAdminMode) {
            await fetchGetUsers(formState.searchText);
        } else {
            const isIndependentUser = state.independentUsersList.find((user) => user.user_id === formState.searchText);
            isNew = !isIndependentUser;
            await fetchGetWorkspaceUsers(formState.searchText);
        }
    } catch (e) {
        state.selectedItems.push({
            user_id: formState.searchText,
            label: formState.searchText,
            name: formState.searchText,
            isNew,
            auth_type: authTypeState.selectedMenuItem,
        });
        formState.searchText = '';
        validationState.userIdInvalid = false;
        validationState.userIdInvalidText = '';
    } finally {
        await hideMenu();
    }
};
const checkValidation = () => {
    if (formState.searchText === '') {
        validationState.userIdInvalid = true;
        validationState.userIdInvalidText = i18n.t('IAM.USER.FORM.ALT_E_INVALID_FULL_NAME');
        return;
    }
    const { isValid, invalidText } = checkEmailFormat(formState.searchText);
    if (!isValid) {
        validationState.userIdInvalid = true;
        validationState.userIdInvalidText = invalidText;
    }
};
const clickOutside = () => {
    if (state.menuVisible) {
        checkValidation();
        hideMenu();
    }
};
// workspace owner only
const handleSelectMenuItem = async (menuItem: AddModalMenuItem) => {
    state.selectedItems.push(menuItem);
    await hideMenu();
};
// TODO: Will be Improved in the next step.
// const initAuthTypeList = async () => {
//     if (store.state.domain.extendedAuthType !== undefined) {
//         authTypeMenuItem.value = [
//             { label: store.getters['domain/extendedAuthTypeLabel'], name: 'EXTERNAL' },
//             ...authTypeMenuItem.value,
//         ];
//     }
// };

/* API */
const fetchListUsers = async () => {
    state.loading = true;

    try {
        const results = await userPageStore.findWorkspaceUser({
            keyword: formState.searchText || '@',
        });
        state.menuItems = results.map((user) => ({
            user_id: user.user_id,
            label: user.name ? `${user.user_id} (${user.name})` : user.user_id,
            name: user.user_id,
        }));
    } catch (e) {
        state.menuItems = [];
    } finally {
        state.loading = false;
    }
};
// user existence check
const fetchGetWorkspaceUsers = async (userId: string) => {
    await SpaceConnector.clientV2.identity.workspaceUser.get<WorkspaceUserGetParameters, WorkspaceUserModel>({
        user_id: userId,
    });
    validationState.userIdInvalid = true;
    validationState.userIdInvalidText = i18n.t('IAM.USER.FORM.USER_ID_INVALID_WORKSPACE', { userId });
};
const fetchGetUsers = async (userId: string) => {
    await SpaceConnector.clientV2.identity.user.get<UserGetParameters, UserModel>({
        user_id: userId,
    });
    validationState.userIdInvalid = true;
    validationState.userIdInvalidText = i18n.t('IAM.USER.FORM.USER_ID_INVALID_DOMAIN', { userId });
};

onClickOutside(containerRef, clickOutside);

watch(() => state.menuVisible, async (menuVisible) => {
    if (menuVisible) {
        formState.searchText = '';
        authTypeState.selectedUserAuthType = authTypeState.selectedMenuItem as AuthType;
        if (!userPageState.isAdminMode) {
            await fetchListUsers();
            state.independentUsersList = await userPageStore.findWorkspaceUser();
        }
    } else {
        state.menuItems = [];
    }
});

// TODO: Will be Improved in the next step.
// onMounted(() => {
//     initAuthTypeList();
// });
</script>

<template>
    <div class="user-info-wrapper">
        <p-field-group required
                       :invalid="validationState.userIdInvalid"
                       :invalid-text="validationState.userIdInvalidText"
                       :class="{'is-admin-mode': userPageState.isAdminMode}"
        >
            <template #label>
                <strong v-if="userPageState.modal.type === USER_MODAL_TYPE.INVITE">
                    {{ $t('IAM.USER.FORM.USER_ID') }}
                </strong>
                <span v-else>
                    <span>{{ $t('IAM.USER.FORM.AUTH_TYPE') }}</span>
                    <span class="and-mark">&</span>
                    <span>{{ $t('IAM.USER.FORM.USER_ID') }}</span>
                </span>
            </template>
            <template #default="{invalid}">
                <div ref="containerRef"
                     class="input-wrapper"
                >
                    <div v-if="userPageState.isAdminMode">
                        <p-select-dropdown :menu="authTypeMenuItem"
                                           :selected="authTypeState.selectedMenuItem"
                                           class="type-dropdown"
                                           @update:selected="handleSelectDropdownItem"
                        />
                    </div>
                    <div class="input-form-wrapper">
                        <p-text-input ref="targetRef"
                                      :invalid="invalid"
                                      :value="formState.searchText"
                                      class="user-id-input"
                                      @click="handleClickTextInput"
                                      @keyup.enter="handleEnterTextInput"
                                      @update:value="handleChangeTextInput"
                        />
                        <p-context-menu v-if="state.menuVisible && state.menuItems.length > 0"
                                        ref="contextMenuRef"
                                        :loading="state.loading"
                                        :menu="state.menuItems"
                                        :selected="state.selectedItems"
                                        multi-selectable
                                        class="user-context-menu"
                                        @select="handleSelectMenuItem"
                        />
                    </div>
                </div>
            </template>
        </p-field-group>
        <p-empty v-if="state.selectedItems.length === 0"
                 show-image
                 :title="$t('IAM.USER.FORM.NO_USER')"
                 class="empty-wrapper"
        >
            {{ $t('IAM.USER.FORM.NO_USER_DESC') }}
        </p-empty>
        <div v-else
             class="selected-user-list"
        >
            <div v-for="(item, idx) in state.selectedItems"
                 :key="`selected-user-list-item-${idx}`"
                 class="selected-user-list-item"
            >
                <div class="selected-user-label-wrapper">
                    <span class="label">{{ item.name }}</span>
                    <span v-if="item.isNew"
                          class="new"
                    >new</span>
                </div>
                <div class="selected-toolbox">
                    <p-select-dropdown v-if="item.isNew"
                                       :selected="item.auth_type"
                                       :menu="authTypeMenuItem"
                                       class="auth-type-dropdown"
                                       style-type="transparent"
                                       @update:selected="handleSelectAuthTypeItem($event, idx)"
                    />
                    <p-icon-button name="ic_delete"
                                   class="delete-btn"
                                   width="1.5rem"
                                   height="1.5rem"
                                   @click="handleClickDeleteButton(idx)"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="postcss">
.user-info-wrapper {
    @apply flex flex-col bg-white border border-primary-3 rounded-md;
    height: 18rem;
    padding: 0.75rem;
    .and-mark {
        @apply font-normal;
        margin-right: 0.25rem;
        margin-left: 0.25rem;
    }
    .input-wrapper {
        @apply flex;
        margin-top: 0.25rem;
        gap: 0.25rem;
        .input-form-wrapper {
            @apply relative;
            width: 100%;
            .user-id-input {
                width: 100%;
            }
            .user-context-menu {
                @apply absolute;
                top: 2rem;
                left: 0;
                max-height: 13.5rem;
                z-index: 10;
            }
        }
    }
    .empty-wrapper {
        margin: auto;
    }
    .selected-user-list {
        @apply overflow-y-scroll;
        height: 12.5rem;
        margin-top: 1rem;
        .selected-user-list-item {
            @apply flex items-center justify-between;
            height: 2.25rem;
            padding-right: 0.5rem;
            padding-left: 0.5rem;
            .selected-user-label-wrapper {
                @apply flex items-start;
                gap: 0.125rem;
                .label {
                    @apply text-label-md;
                }
                .new {
                    @apply text-label-sm text-coral-500;
                    margin-top: -0.125rem;
                }
            }
            .selected-toolbox {
                @apply flex items-center;
            }
        }
    }
}

/* custom design-system component - p-button */
:deep(.p-field-group) {
    @apply relative;
    .invalid-feedback {
        @apply absolute;
        bottom: -1.125rem;
        left: 0;
    }
    &.is-admin-mode {
        .invalid-feedback {
            left: 6.75rem;
        }
    }
}
</style>
