<script setup lang="ts">
import {
    computed, reactive, watch,
} from 'vue';

import { PI, PTextInput, PFieldGroup } from '@spaceone/design-system';

import { store } from '@/store';
import { i18n } from '@/translations';

import { emailValidator } from '@/lib/helper/user-validation-helper';
import { postUserProfileValidationEmail } from '@/lib/helper/verify-email-helper';

import ErrorHandler from '@/common/composables/error/errorHandler';
import { useFormValidator } from '@/common/composables/form-validator';
import VerifyButton from '@/common/modules/button/verify-button/VerifyButton.vue';
import NotificationEmailModal from '@/common/modules/modals/notification-email-modal/NotificationEmailModal.vue';

import UserAccountModuleContainer from '@/services/my-page/components/UserAccountModuleContainer.vue';


const state = reactive({
    userType: computed(() => store.state.user.backend),
    verified: computed(() => store.state.user.emailVerified),
    userId: computed(() => store.state.user.userId),
    domainId: computed(() => store.state.domain.domainId),
    loading: false,
    isModalVisible: false,
    modalType: '',
});
const {
    forms: {
        notificationEmail,
    },
    setForm,
    invalidState,
    invalidTexts,
} = useFormValidator({
    notificationEmail: '',
}, {
    notificationEmail(value: string) { return !emailValidator(value) ? '' : i18n.t('MY_PAGE.NOTIFICATION_EMAIL.EMAIL_INVALID'); },
});

const handleClickVerifyButton = async (type: string) => {
    state.loading = true;
    try {
        if (state.verified) return;
        await postUserProfileValidationEmail({
            email: notificationEmail.value,
        });
        await store.dispatch('user/setUser', { email: notificationEmail });
    } catch (e: any) {
        ErrorHandler.handleError(e);
    } finally {
        state.isModalVisible = true;
        state.modalType = type;
        state.loading = false;
    }
};

/* Watcher */
watch(() => store.state.user.email, (value) => {
    let result = value;
    if (value === '') {
        if (state.userType === 'LOCAL') {
            result = state.userId;
        } else {
            result = '';
        }
    }
    setForm('notificationEmail', result);
}, { immediate: true });
</script>

<template>
    <user-account-module-container
        class="notification-email-wrapper"
    >
        <template #headline>
            <div class="headline-wrapper">
                <p class="form-title">
                    {{ $t('IDENTITY.USER.NOTIFICATION_EMAIL.TITLE') }}
                </p>
                <div class="verify-status-wrapper">
                    <div v-if="state.verified"
                         class="verified"
                    >
                        <p-i name="ic_verified"
                             height="1rem"
                             width="1rem"
                             class="verified-icon"
                             color="#60B731"
                        />
                        <span>
                            {{ $t('IDENTITY.USER.NOTIFICATION_EMAIL.VERIFIED') }}
                        </span>
                    </div>
                    <span v-else
                          class="not-verified"
                    >
                        {{ $t('IDENTITY.USER.NOTIFICATION_EMAIL.NOT_VERIFIED') }}
                    </span>
                </div>
            </div>
        </template>
        <span class="help-text">
            {{ $t('IDENTITY.USER.NOTIFICATION_EMAIL.HELP_TEXT') }}
        </span>
        <form class="form"
              onsubmit="return false"
        >
            <p-field-group
                :invalid="invalidState.notificationEmail"
                :invalid-text="invalidTexts.notificationEmail"
                required
                class="field-group"
            >
                <p-text-input :value="notificationEmail"
                              :placeholder="state.userId"
                              :disabled="state.verified"
                              :invalid="invalidState.notificationEmail"
                              block
                              @update:value="setForm('notificationEmail', $event)"
                />
            </p-field-group>
            <verify-button
                :loading="state.loading"
                :email="notificationEmail"
                :verified="state.verified"
                @click-button="handleClickVerifyButton"
            >
                <notification-email-modal
                    :domain-id="state.domainId"
                    :user-id="state.userId"
                    :email="notificationEmail"
                    :modal-type="state.modalType"
                    :visible.sync="state.isModalVisible"
                />
            </verify-button>
        </form>
    </user-account-module-container>
</template>

<style lang="postcss" scoped>
.notification-email-wrapper {
    margin-top: 1rem;
    .headline-wrapper {
        @apply flex items-center;
        margin-bottom: 1.625rem;
        .form-title {
            @apply text-display-md;
            margin-bottom: 0;
        }
        .verify-status-wrapper {
            margin-left: 0.5rem;
            .verified {
                @apply flex items-center text-label-md text-green-600;
                gap: 0.25rem;
            }
            .not-verified {
                @apply bg-yellow-200 text-label-sm;
                padding: 0.15rem 0.5rem;
                border-radius: 6.25rem;
            }
        }
    }
    .help-text {
        @apply text-paragraph-md;
    }
    .form {
        @apply relative flex;
        max-width: 33.625rem;
        margin-top: 1rem;

        .icon-edit {
            margin-right: 0.375rem;
        }

        /* custom design-system component - p-field-group */
        :deep(.p-field-group) {
            flex: 1;
            &.field-group {
                margin-bottom: 0;

                /* custom design-system component - p-text-input */
                :deep(.p-text-input) {
                    &::placeholder {
                        @apply text-gray-300;
                    }
                }
                .invalid-feedback {
                    position: absolute;
                }
            }
        }
    }
}
</style>
