<template>
    <p-pane-layout>
        <collector-detail-section-header :title="$t('INVENTORY.COLLECTOR.ADDITIONAL_OPTIONS')"
                                         :edit-mode="state.isEditMode"
                                         :hide-edit-button="state.isCollectorOptionsSchemaEmpty"
                                         @click-edit="handleClickEdit"
        />
        <p-definition-table v-if="!state.isEditMode"
                            :fields="state.fields"
                            :loading="state.loading"
                            :data="state.collectorOptions"
                            style-type="white"
        >
            <template #data="{value}">
                {{ value ? value : '--' }}
            </template>
            <template #no-data>
                <div class="no-data-box">
                    <p-empty image-size="sm"
                             show-image
                             :title="$t('INVENTORY.COLLECTOR.NO_OPTIONS')"
                    >
                        <template #image>
                            <img src="../../../assets/images/illust_circle_boy.svg"
                                 alt="empty-options"
                                 class="empty-options-image"
                            >
                        </template>
                    </p-empty>
                </div>
            </template>
        </p-definition-table>
        <collector-options-form v-else
                                has-metadata
                                reset-on-collector-id-change
                                @update:isValid="handleUpdateIsOptionsValid"
        />
        <div class="button-group">
            <p-button v-if="state.isEditMode"
                      style-type="tertiary"
                      size="lg"
                      :disabled="state.isUpdating"
                      @click="handleClickCancel"
            >
                {{ $t('INVENTORY.COLLECTOR.DETAIL.CANCEL') }}
            </p-button>
            <p-button v-if="state.isEditMode"
                      style-type="primary"
                      size="lg"
                      :loading="state.isUpdating"
                      class="save-changes-button"
                      @click="handleClickSave"
            >
                {{ $t('INVENTORY.COLLECTOR.DETAIL.SAVE_CHANGES') }}
            </p-button>
        </div>
    </p-pane-layout>
</template>

<script lang="ts" setup>
import { computed, reactive } from 'vue';

import {
    PButton, PPaneLayout, PDefinitionTable, PEmpty,
} from '@spaceone/design-system';
import type { DefinitionField } from '@spaceone/design-system/types/data-display/tables/definition-table/type';
import type { JsonSchema } from '@spaceone/design-system/types/inputs/forms/json-schema-form/type';

import { SpaceConnector } from '@cloudforet/core-lib/space-connector';

import type { CollectorUpdatePluginParameters } from '@/schema/inventory/collector/api-verbs/update-plugin';
import type { CollectorModel } from '@/schema/inventory/collector/model';
import type { CollectorOptions } from '@/schema/inventory/collector/type';
import { i18n } from '@/translations';

import { showSuccessMessage } from '@/lib/helper/notice-alert-helper';

import ErrorHandler from '@/common/composables/error/errorHandler';

import CollectorDetailSectionHeader from '@/services/asset-inventory/components/CollectorDetailSectionHeader.vue';
import CollectorOptionsForm from '@/services/asset-inventory/components/CollectorFormOptions.vue';
import { useCollectorFormStore } from '@/services/asset-inventory/stores/collector-form-store';




const collectorFormStore = useCollectorFormStore();
const collectorFormState = collectorFormStore.$state;

const state = reactive({
    loading: computed<boolean>(() => !collectorFormState.originCollector),
    collectorOptions: computed<CollectorOptions>(() => collectorFormState.originCollector?.plugin_info?.options ?? {}),
    collectorOptionsSchema: computed<JsonSchema>(() => collectorFormState.originCollector?.plugin_info?.metadata?.options_schema ?? {
        type: 'object',
        properties: {},
    }),
    isCollectorOptionsSchemaEmpty: computed<boolean>(() => Object.keys(state.collectorOptionsSchema?.properties ?? {}).length === 0),
    fields: computed<DefinitionField[]>(() => {
        const properties = state.collectorOptionsSchema?.properties ?? {};
        const order: string[] = state.collectorOptionsSchema?.order ?? [];
        return Object.entries<JsonSchema['properties']>(properties).map(([key, property]) => ({
            name: key,
            label: property?.title ?? key,
            disableCopy: !state.collectorOptions[key],
        })).sort((a, b) => {
            const aIndex = order.indexOf(a.name);
            const bIndex = order.indexOf(b.name);
            if (aIndex === -1 && bIndex === -1) return a.name.localeCompare(b.name);
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;
            return aIndex - bIndex;
        });
    }),
    isEditMode: false,
    isOptionsValid: false,
    isUpdating: false,
});

const fetchCollectorPluginUpdate = async (): Promise<CollectorModel> => {
    if (!collectorFormStore.collectorId) throw new Error('collector_id is required');
    const params: CollectorUpdatePluginParameters = {
        collector_id: collectorFormStore.collectorId,
        options: collectorFormState.options,
    };
    return SpaceConnector.clientV2.inventory.collector.updatePlugin<CollectorUpdatePluginParameters, CollectorModel>(params);
};
const handleClickEdit = () => {
    state.isEditMode = true;
};

const handleUpdateIsOptionsValid = (value: boolean) => {
    state.isOptionsValid = value;
};

const handleClickCancel = () => {
    state.isEditMode = false;
};

const handleClickSave = async () => {
    try {
        state.isUpdating = true;
        const collector = await fetchCollectorPluginUpdate();
        collectorFormStore.setOriginCollector(collector);
        showSuccessMessage(i18n.t('INVENTORY.COLLECTOR.ALT_S_UPDATE_COLLECTOR_OPTIONS'), '');
        state.isEditMode = false;
    } catch (error) {
        collectorFormStore.resetOptions();
        ErrorHandler.handleRequestError(error, i18n.t('INVENTORY.COLLECTOR.ALT_E_UPDATE_COLLECTOR_OPTIONS'));
    } finally {
        state.isUpdating = false;
    }
};

</script>

<style lang="postcss" scoped>
.p-definition-table {
    border-color: transparent;
}
.collector-options-form {
    padding: 0 1rem;
}

.no-data-box {
    @apply flex flex-col justify-end;
    height: 10.8125rem;

    .empty-options-image {
        height: 100%;
    }
}

.button-group {
    padding: 1rem;
    margin-bottom: 1.5rem;
    .save-changes-button {
        margin-left: 1rem;
    }
}
</style>
