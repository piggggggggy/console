<script setup lang="ts">
import { computed, reactive, watch } from 'vue';

import { PFieldGroup, PJsonSchemaForm, PTextInput } from '@spaceone/design-system';
import { isEmpty } from 'lodash';

import { SpaceConnector } from '@cloudforet/core-lib/space-connector';

import type { ListResponse } from '@/schema/_common/api-verbs/list';
import type { ServiceAccountListParameters } from '@/schema/identity/service-account/api-verbs/list';
import { ACCOUNT_TYPE } from '@/schema/identity/service-account/constant';
import type { ServiceAccountModel } from '@/schema/identity/service-account/model';
import type { AccountType } from '@/schema/identity/service-account/type';
import { i18n } from '@/translations';

import TagsInputGroup from '@/common/components/forms/tags-input-group/TagsInputGroup.vue';
import type { Tag } from '@/common/components/forms/tags-input-group/type';
import { useFormValidator } from '@/common/composables/form-validator';

import ServiceAccountProjectForm from '@/services/asset-inventory/components/ServiceAccountProjectForm.vue';
import type { BaseInformationForm, ProjectForm } from '@/services/asset-inventory/types/service-account-page-type';



interface Props {
    schema: any;
    isValid: boolean;
    originForm?: Partial<BaseInformationForm>;
    accountType?: AccountType;
}

const props = withDefaults(defineProps<Props>(), {
    schema: () => ({}),
    isValid: false,
    originForm: () => ({}),
    accountType: ACCOUNT_TYPE.GENERAL,
});

const emit = defineEmits<{(e:'update:isValid', isValid: boolean): void;
    (e:'change', formData: BaseInformationForm): void;
}>();

const {
    forms: { serviceAccountName },
    invalidState,
    invalidTexts,
    setForm,
} = useFormValidator({
    serviceAccountName: '',
}, {
    serviceAccountName: (val: string) => {
        if (val.length < 2) {
            return i18n.t('IDENTITY.SERVICE_ACCOUNT.ADD.NAME_INVALID');
        } if (state.serviceAccountNames.includes(val)) {
            if (props.originForm?.accountName === val) return true;
            return i18n.t('IDENTITY.SERVICE_ACCOUNT.ADD.NAME_DUPLICATED');
        }
        return true;
    },
});
const state = reactive({
    serviceAccountNames: [] as string[],
    customSchemaForm: {},
    isCustomSchemaFormValid: undefined,
    tags: {},
    isTagsValid: true,
    projectForm: {} as ProjectForm,
    isProjectFormValid: true,
    formData: computed<BaseInformationForm>(() => ({
        accountName: serviceAccountName.value,
        customSchemaForm: state.customSchemaForm,
        projectForm: state.projectForm,
        tags: state.tags,
    })),
    isAllValid: computed(() => (!invalidState.serviceAccountName
        && ((props.accountType === ACCOUNT_TYPE.TRUSTED) ? true : state.isProjectFormValid)
        && state.isTagsValid
        && (isEmpty(props.schema) ? true : state.isCustomSchemaFormValid))),
});

/* Util */
const initFormData = (originForm: Partial<BaseInformationForm>) => {
    setForm('serviceAccountName', originForm?.accountName);
    state.customSchemaForm = originForm?.customSchemaForm ?? {};
    state.tags = originForm?.tags ?? {};
    // init validation
    state.isCustomSchemaFormValid = true;
    state.projectForm.selectedProjectId = originForm?.projectForm?.selectedProjectId;
};

/* Api */
const listServiceAccounts = async () => {
    const { results } = await SpaceConnector.clientV2.identity.serviceAccount.list<ServiceAccountListParameters, ListResponse<ServiceAccountModel>>({
        query: {
            only: ['name'],
        },
    });
    state.serviceAccountNames = (results ?? []).map((v) => v.name);
};

/* Event */
const handleUpdateTags = (tags: Tag) => {
    state.tags = tags;
};
const handleAccountValidate = (isValid) => {
    state.isCustomSchemaFormValid = isValid;
};

const handleChangeProjectForm = (projectForm) => {
    state.projectForm = projectForm;
};

/* Init */
(async () => {
    await listServiceAccounts();
})();

/* Watcher */
watch(() => state.isAllValid, (isAllValid) => {
    emit('update:isValid', isAllValid);
}, { immediate: true });
watch(() => state.formData, (formData) => {
    emit('change', formData);
});
watch(() => props.originForm, (originForm) => {
    if (!isEmpty(originForm)) initFormData(originForm);
}, { immediate: true });

</script>

<template>
    <div class="service-account-base-information-form">
        <p-field-group :label="$t('IDENTITY.SERVICE_ACCOUNT.ADD.NAME_LABEL')"
                       :invalid="invalidState.serviceAccountName"
                       :invalid-text="invalidTexts.serviceAccountName"
                       :required="true"
        >
            <template #default="{invalid}">
                <p-text-input :value="serviceAccountName"
                              class="account-name-input block"
                              :invalid="invalid"
                              :placeholder="$t('IDENTITY.SERVICE_ACCOUNT.ADD.BASE_NAME_PLACEHOLDER')"
                              @update:value="setForm('serviceAccountName', $event)"
                />
            </template>
        </p-field-group>
        <p-json-schema-form v-if="props.schema"
                            class="p-json-schema-form"
                            :form-data.sync="state.customSchemaForm"
                            :schema="props.schema"
                            :language="$store.state.user.language"
                            @validate="handleAccountValidate"
        />
        <p-field-group v-if="props.accountType === ACCOUNT_TYPE.GENERAL"
                       required
                       :label="$t('IDENTITY.SERVICE_ACCOUNT.ADD.PROJECT_TITLE')"
                       class="account-tags"
        >
            <service-account-project-form :is-valid.sync="state.isProjectFormValid"
                                          :project-id="props.originForm?.projectForm?.selectedProjectId"
                                          @change="handleChangeProjectForm"
            />
        </p-field-group>
        <p-field-group :label="$t('IDENTITY.SERVICE_ACCOUNT.ADD.TAG_LABEL')"
                       :help-text="$t('INVENTORY.SERVICE_ACCOUNT.DETAIL.BASE_INFO_HELP_TEXT')"
                       class="account-tags"
        >
            <tags-input-group :tags="state.tags"
                              show-validation
                              :is-valid.sync="state.isTagsValid"
                              @update-tags="handleUpdateTags"
            />
        </p-field-group>
    </div>
</template>

<style lang="postcss" scoped>
.service-account-base-information-form {
    /* custom design-system component - p-text-input */
    :deep(.account-name-input) {
        .input-container {
            max-width: 30rem;
            width: 50%;
        }
    }

    /* custom design-system component - p-field-group */
    :deep(.account-tags) {
        .help-msg {
            font-size: 0.875rem;
            white-space: pre-line;
        }
    }

    /* custom design-system component - p-json-schema-form */
    :deep(.p-json-schema-form) {
        .p-text-input {
            width: 100%;
            .input-container {
                max-width: 30rem;
                width: 50%;
            }
        }
    }

    @screen tablet {
        /* custom design-system component - p-text-input */
        :deep(.account-name-input) {
            .input-container {
                width: 100%;
            }
        }

        /* custom design-system component - p-json-schema-form */
        :deep(.p-json-schema-form) {
            .p-text-input {
                .input-container {
                    width: 100%;
                }
            }
        }
    }
}
</style>
