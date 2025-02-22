<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue';

import {
    PFieldGroup, PTextInput,
} from '@spaceone/design-system';

import { useProxyValue } from '@/common/composables/proxy-state';

import { useUserPageStore } from '@/services/administration/store/user-page-store';
import type { UserListItemType } from '@/services/administration/types/user-type';

interface Props {
    name?: string
}
const props = withDefaults(defineProps<Props>(), {
    name: '',
});

const userPageStore = useUserPageStore();

const emit = defineEmits<{(e: 'update:name', value: string): void}>();

const state = reactive({
    data: computed<UserListItemType>(() => userPageStore.selectedUsers[0]),
    proxyName: useProxyValue('name', props, emit),
});

/* Components */
const handleChangeName = (value: string) => {
    state.proxyName = value;
};
const setForm = () => {
    state.proxyName = state.data.name || '';
};

/* Init */
onMounted(() => {
    setForm();
});
</script>

<template>
    <div class="user-info-form-wrapper">
        <p-field-group :label="$t('IAM.USER.FORM.USER_ID')"
                       required
        >
            <p-text-input :value="state.data.user_id"
                          disabled
                          block
            />
        </p-field-group>
        <p-field-group :label="$t('IAM.USER.FORM.NAME')"
                       class="input-form"
        >
            <p-text-input :value="state.proxyName"
                          class="text-input"
                          block
                          @update:value="handleChangeName"
            />
        </p-field-group>
    </div>
</template>

<style lang="postcss" scoped>
.user-info-form-wrapper {
    @apply flex flex-col bg-white rounded-lg;
    padding: 0.75rem;
    gap: 1rem;
}
</style>
