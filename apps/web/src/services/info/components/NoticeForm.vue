<script lang="ts" setup>
import {
    computed, reactive, watch,
} from 'vue';

import {
    PPaneLayout, PFieldGroup, PTextInput, PRadio, PSelectDropdown, PCheckbox, PButton,
} from '@spaceone/design-system';

import { SpaceConnector } from '@cloudforet/core-lib/space-connector';

import { SpaceRouter } from '@/router';
import type { PostUpdateParameters } from '@/schema/board/post/api-verbs/update';
import { POST_BOARD_TYPE } from '@/schema/board/post/constant';
import type { DomainGetParameters } from '@/schema/identity/domain/api-verbs/get';
import type { DomainListParameters, DomainListResponse } from '@/schema/identity/domain/api-verbs/list';
import type { DomainModel } from '@/schema/identity/domain/model';
import { store } from '@/store';
import { i18n } from '@/translations';

import { showSuccessMessage } from '@/lib/helper/notice-alert-helper';

import { emptyHtmlRegExp } from '@/common/components/editor/extensions/image/helper';
import type { Attachment } from '@/common/components/editor/extensions/image/type';
import TextEditor from '@/common/components/editor/TextEditor.vue';
import ErrorHandler from '@/common/composables/error/errorHandler';
import { useFileUploader } from '@/common/composables/file-uploader';
import { useFormValidator } from '@/common/composables/form-validator';

import { INFO_ROUTE } from '@/services/info/routes/route-constant';
import { useNoticeDetailStore } from '@/services/info/stores/notice-detail-store';

interface Props {
    type?: NoticeFormType;
}
interface DomainItem {
    name: string;
    label: string;
}

type NoticeFormType = 'CREATE' | 'EDIT';

const props = withDefaults(defineProps<Props>(), {
    type: 'CREATE',
});

const noticeDetailStore = useNoticeDetailStore();
const noticeDetailState = noticeDetailStore.state;

const state = reactive({
    hasSystemRole: computed<boolean>(() => store.getters['user/hasSystemRole']),
    hasDomainRole: computed<boolean>(() => store.getters['user/isDomainAdmin']),
    userName: computed<string>(() => store.state.user.name),
    isPinned: false,
    isPopup: false,
    attachments: [] as Attachment[],
    isAllDomainSelected: !!store.getters['user/hasSystemRole'], // It's active only in root domain case
    domainList: [] as Array<DomainItem>,
    selectedDomain: store.getters['user/hasSystemRole']
        ? []
        : [{ name: store.state.domain.domainId, label: store.state.domain.domainId }] as Array<DomainItem>,
    domainName: '',
});

const {
    forms: {
        noticeTitle,
        writerName,
        contents,
    },
    setForm,
    invalidState,
    invalidTexts,
    isAllValid,
} = useFormValidator({
    noticeTitle: noticeDetailState.post?.title ?? '',
    writerName: noticeDetailState.post?.writer || state.userName || '',
    contents: noticeDetailState.post?.contents || '',
}, {
    noticeTitle(value: string) { return value.trim().length ? '' : i18n.t('INFO.NOTICE.FORM.TITLE_REQUIRED'); },
    writerName(value: string) { return value.trim().length ? '' : i18n.t('INFO.NOTICE.FORM.WRITER_REQUIRED'); },
    contents(value: string) {
        return value.replace(emptyHtmlRegExp, '').length ? '' : i18n.t('INFO.NOTICE.FORM.CONTENT_REQUIRED');
    },
});

const formData = computed<Omit<PostUpdateParameters, 'post_id'>>(() => ({
    title: noticeTitle.value,
    writer: writerName.value,
    contents: contents.value,
    files: state.attachments.map(({ fileId }) => fileId) as string[],
    options: {
        is_pinned: state.isPinned,
        is_popup: state.isPopup,
    },
}));

const { fileUploader } = useFileUploader(computed(() => (state.isAllDomainSelected ? null : state.selectedDomain[0].name)));

const handleConfirm = () => {
    if (props.type === 'CREATE') handleCreateNotice();
    if (props.type === 'EDIT') handleEditNotice();
};

const handleCreateNotice = async () => {
    try {
        const data = formData.value;
        if (!data.title || !data.contents) throw new Error('Invalid form data');
        await noticeDetailStore.createNoticePost({
            board_type: POST_BOARD_TYPE.NOTICE,
            title: data.title,
            contents: data.contents,
            category: data.category,
            files: data.files,
            options: data.options,
            writer: data.writer,
            resource_group: 'DOMAIN',
        });
        showSuccessMessage(i18n.t('INFO.NOTICE.FORM.ALT_S_CREATE_NOTICE'), '');
        await SpaceRouter.router.push({ name: INFO_ROUTE.NOTICE._NAME, query: {} });
    } catch (e) {
        ErrorHandler.handleRequestError(e, i18n.t('INFO.NOTICE.FORM.ALT_E_CREATE_NOTICE'));
    }
};
const handleEditNotice = async () => {
    try {
        const params = state.isAllDomainSelected
            ? {
                ...formData.value,
            }
            : {
                ...formData.value,
                domain_id: state.selectedDomain[0].name,
            };
        await noticeDetailStore.updateNoticePost(params);
        showSuccessMessage(i18n.t('INFO.NOTICE.FORM.ALT_S_UPDATE_NOTICE'), '');
        SpaceRouter.router.back();
    } catch (e) {
        ErrorHandler.handleRequestError(e, i18n.t('INFO.NOTICE.FORM.ALT_E_UPDATE_NOTICE'));
    }
};

const handleClickAllDomainRadio = () => { state.isAllDomainSelected = true; };
const handleClickSelectDomainRadio = () => { state.isAllDomainSelected = false; };

const handleSelectDomain = (domain: Array<DomainItem>) => {
    if (!state.isAllDomainSelected) {
        state.selectedDomain = domain;
    }
};

const getDomainList = async () => {
    try {
        const { results } = await SpaceConnector.clientV2.identity.domain.list<DomainListParameters, DomainListResponse>();
        state.domainList = results.map((d) => ({
            name: d.domain_id,
            label: d.name,
        }));
    } catch (e) {
        ErrorHandler.handleError(e);
        state.domainList = [];
    }
};


watch(() => state.isAllDomainSelected, (isAllDomain: boolean) => {
    if (isAllDomain) state.selectedDomain = [];
});

watch(() => noticeDetailState.post, async (notice) => {
    if (!notice || !Object.keys(notice).length) return;
    if (notice?.domain_id) {
        const { name } = await SpaceConnector.clientV2.identity.domain.get<DomainGetParameters, DomainModel>({ domain_id: notice.domain_id });
        state.domainName = name;
    }

    // INIT STATES
    state.isPinned = notice.options?.is_pinned ?? false;
    state.isPopup = notice.options?.is_popup ?? false;
    state.attachments = notice.files?.map((file) => ({ fileId: file.file_id, downloadUrl: file.download_url ?? '' })) ?? [];
    state.isAllDomainSelected = !notice?.domain_id;
    state.selectedDomain = notice?.domain_id
        ? [{ name: notice.domain_id, label: state.domainName || notice.domain_id }]
        : [];
    setForm('writerName', notice.writer);
    setForm('noticeTitle', notice.title);
    setForm('contents', notice.contents);
});

(async () => {
    if (state.hasSystemRole) await getDomainList();
})();
</script>

<template>
    <div class="notice-form">
        <p-pane-layout class="notice-form-wrapper">
            <p-field-group class="notice-label-wrapper writer-name-input"
                           :label="$t('INFO.NOTICE.FORM.LABEL_WRITER_NAME')"
                           required
            >
                <template #default="{invalid}">
                    <p-text-input :value="writerName"
                                  :invalid="invalid"
                                  :placeholder="$store.state.user.name || $t('INFO.NOTICE.FORM.PLACEHOLDER_REQUIRED')"
                                  @update:value="setForm('writerName', $event)"
                    />
                </template>
            </p-field-group>
            <p-field-group v-if="state.hasSystemRole"
                           class="notice-label-wrapper"
                           :label="$t('INFO.NOTICE.FORM.LABEL_VIEWER')"
                           required
            >
                <p-radio :disabled="props.type === 'EDIT'"
                         :selected="state.isAllDomainSelected"
                         class="mr-4"
                         @change="handleClickAllDomainRadio"
                >
                    <span>{{ $t('INFO.NOTICE.FORM.ALL_DOMAINS') }}</span>
                </p-radio>
                <p-radio :disabled="props.type === 'EDIT'"
                         :selected="!state.isAllDomainSelected"
                         @change="handleClickSelectDomainRadio"
                >
                    <span>{{ $t('INFO.NOTICE.FORM.SELECTED_DOMAIN') }}</span>
                </p-radio>
                <br>
                <p-select-dropdown class="mt-2 w-1/2"
                                   :menu="state.domainList"
                                   :selected="state.selectedDomain"
                                   :disabled="state.isAllDomainSelected || props.type === 'EDIT'"
                                   :placeholder="state.isAllDomainSelected ? $t('INFO.NOTICE.FORM.PLACEHOLDER_ALL') : ''"
                                   is-filterable
                                   show-delete-all-button
                                   @update:selected="handleSelectDomain"
                />
            </p-field-group>
            <p-field-group class="notice-label-wrapper"
                           :label="$t('INFO.NOTICE.FORM.LABEL_TITLE')"
                           required
                           :invalid="invalidState.noticeTitle"
                           :invalid-text="invalidTexts.noticeTitle"
            >
                <template #default="{invalid}">
                    <p-text-input :value="noticeTitle"
                                  :invalid="invalid"
                                  class="!w-full"
                                  @update:value="setForm('noticeTitle', $event)"
                    />
                </template>
            </p-field-group>
            <p-field-group class="notice-label-wrapper"
                           :label="$t('INFO.NOTICE.FORM.LABEL_CONTENT')"
                           required
                           :invalid="invalidState.contents"
                           :invalid-text="invalidTexts.contents"
            >
                <template #default="{invalid}">
                    <text-editor :value="contents"
                                 :attachments.sync="state.attachments"
                                 :image-uploader="fileUploader"
                                 :invalid="invalid"
                                 @update:value="(d) => setForm('contents', d)"
                    />
                </template>
            </p-field-group>
            <div v-if="state.hasSystemRole || state.hasDomainRole"
                 class="notice-create-options-wrapper"
            >
                <p-checkbox v-model="state.isPinned">
                    <span>{{ $t('INFO.NOTICE.FORM.PIN_NOTICE') }}</span>
                </p-checkbox>
                <p-checkbox v-model="state.isPopup">
                    <span>{{ $t('INFO.NOTICE.FORM.IN_POP_UP') }}</span>
                </p-checkbox>
            </div>
        </p-pane-layout>
        <div class="notice-create-buttons-wrapper">
            <p-button style-type="tertiary"
                      size="lg"
                      @click="$router.go(-1)"
            >
                {{ $t('INFO.NOTICE.FORM.CANCEL') }}
            </p-button>
            <p-button style-type="primary"
                      size="lg"
                      :disabled="!isAllValid"
                      @click="handleConfirm"
            >
                {{ $t('INFO.NOTICE.FORM.CONFIRM') }}
            </p-button>
        </div>
    </div>
</template>

<style scoped lang="postcss">
.notice-form-wrapper {
    padding: 1.625rem 0.625rem;
    .notice-label-wrapper {
        @apply mb-4;
        .p-radio {
            @apply inline-flex gap-1;
        }
    }
    .writer-name-input {
        /* custom design-system component - p-text-input */
        :deep(.p-text-input) {
            @apply w-1/2;
            .input-container {
                @apply w-full;
            }
        }
    }
    .notice-create-options-wrapper {
        @apply flex flex-col gap-2;
    }
}
.notice-create-buttons-wrapper {
    @apply inline-flex float-right mt-4;
    & .p-button {
        @apply ml-4;
    }
}
</style>
