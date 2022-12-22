<template>
    <div
        class="manage-wrapper"
    >
        <p-field-group class="name-form"
                       :label="$t('DASHBOARDS.CUSTOMIZE.VARIABLES.LABEL_NAME')"
                       required
        >
            <p-text-input :value="name"
                          class="name-input"
                          @input="setForm('name', $event)"
            />
        </p-field-group>
        <p-field-group class="selection-type-form"
                       :label="$t('DASHBOARDS.CUSTOMIZE.VARIABLES.LABEL_SELECTION_TYPE')"
                       required
        >
            <p-select-dropdown class="selection-type-dropdown"
                               :items="selectionItems"
                               :selected="selection_type"
                               @select="setForm('selection_type', $event)"
            />
        </p-field-group>
        <p-field-group :label="$t('DASHBOARDS.CUSTOMIZE.VARIABLES.LABEL_OPTIONS')"
                       required
        >
            <div class="options-wrapper">
                <p-button class="option-add-button"
                          icon-left="ic_plus"
                          style-type="secondary"
                          @click="handleAddOptions"
                >
                    {{ $t('DASHBOARDS.CUSTOMIZE.VARIABLES.ADD_OPTIONS') }}
                </p-button>
                <draggable :list="contentValueState.options"
                           class="draggable-wrapper"
                           ghost-class="ghost"
                >
                    <div v-for="(option, idx) in contentValueState.options"
                         :key="`drag-item-${option.value}-${idx}`"
                         class="draggable-item"
                    >
                        <p-i class="grab-area"
                             name="ic_drag-handle--slim"
                             width="1rem"
                             height="1rem"
                        />
                        <p-text-input class="option-input"
                                      :value="option.value"
                                      :placeholder="$t('DASHBOARDS.CUSTOMIZE.VARIABLES.PLACEHOLDER_OPTIONS')"
                                      @input="handleOptionValue(idx, ...arguments)"
                        />
                        <div class="option-delete-area">
                            <p-icon-button v-if="contentValueState.options.length > 1"
                                           name="ic_trashcan"
                                           @click="handleDeleteOption(idx)"
                            />
                        </div>
                    </div>
                </draggable>
            </div>
        </p-field-group>
        <div class="button-wrapper">
            <p-button style-type="tertiary"
                      @click="handleCancel"
            >
                {{ $t('DASHBOARDS.CUSTOMIZE.VARIABLES.CANCEL') }}
            </p-button>
            <p-button :disabled="invalidState.name ">
                {{ $t('DASHBOARDS.CUSTOMIZE.VARIABLES.SAVE') }}
            </p-button>
        </div>
    </div>
</template>

<script lang="ts">
import type { PropType, SetupContext } from 'vue';
import {
    computed, defineComponent, reactive, toRefs, watch,
} from 'vue';
import draggable from 'vuedraggable';

import {
    PButton, PFieldGroup, PIconButton, PSelectDropdown, PTextInput, PI,
} from '@spaceone/design-system';

import { i18n } from '@/translations';

import { useFormValidator } from '@/common/composables/form-validator';
import { useProxyValue } from '@/common/composables/proxy-state';

import type { DashboardVariableSchemaProperty, VariableSelectionType } from '@/services/dashboards/config';

interface VariableForm {
    name: string;
    selection_type: VariableSelectionType;
}

export default defineComponent({
    name: 'DashboardManageVariableForm',
    components: {
        PButton,
        PFieldGroup,
        PIconButton,
        PSelectDropdown,
        PTextInput,
        PI,
        draggable,
    },
    props: {
        formType: {
            default: 'LIST',
            type: String,
        },
        data: {
            default: {} as DashboardVariableSchemaProperty,
            type: Object as PropType<DashboardVariableSchemaProperty>,
        },
    },
    setup(props, { emit }: SetupContext) {
        const state = reactive({
            proxyFormType: useProxyValue('formType', props, emit),
            selectionItems: computed(() => [
                { name: 'MULTI', label: i18n.t('Multi select') },
                { name: 'SINGLE', label: i18n.t('Single select') },
            ]),
        });

        const {
            forms: { name, selection_type },
            invalidState,
            setForm,
        } = useFormValidator<VariableForm>(
            {
                name: props.data?.name ?? '',
                selection_type: props.data?.selection_type ?? 'MULTI',
            },
            {
                name: (val: string) => {
                    console.log(val, props.data?.name);
                    return val !== props.data?.name && val !== '';
                },
                selection_type: () => true,
            },
        );
        const contentValueState = reactive({
            // name: '',
            // selectionType: 'MULTI',
            options: [
                // { value: 'a-test' },
                // { value: 'b-test-test' },
                // { value: 'c-test-test-test' },
                { value: '' },
            ],
        });
        //
        // const cancelModalState = reactive({
        //     visible: false,
        // });

        /* controller */


        /* event */
        const handleCancel = () => {
            // const test = {
            //     ...props.data,
            //     name: contentValueState.name,
            //     selection_type: contentValueState.selectionType,
            //     options: contentValueState.options,
            // };
            // console.log(test, props.data, test === props.data);
            // const isChangedForm = props.data === {
            //     ...props.data,
            //     name: contentValueState.name.value,
            //     selection_type: contentValueState.selectionType,
            //     options: contentValueState.options,
            // };
            state.proxyFormType = 'LIST';
            // cancelModalState.visible = true;
        };
        const handleAddOptions = () => {
            // setForm('options', [...options.value, { value: '' }]);
            contentValueState.options = [...contentValueState.options, { value: '' }];
        };
        const handleOptionValue = (idx, value) => {
            // setForm('options', [...options.value.slice(0, idx), { value }, ...options.value.slice(idx + 1)]);
            contentValueState.options[idx].value = value;
        };
        const handleDeleteOption = (idx) => {
            // setForm('options', [...options.value.slice(0, idx), ...options.value.slice(idx + 1)]);
            contentValueState.options = [...contentValueState.options.slice(0, idx), ...contentValueState.options.slice(idx + 1)];
        };
        //
        watch(() => name.value, () => {
            console.log(name.value, invalidState);
        });

        return {
            ...toRefs(state),
            contentValueState,
            name,
            selection_type,
            invalidState,
            setForm,
            handleAddOptions,
            handleOptionValue,
            handleDeleteOption,
            handleCancel,
        };
    },
});

</script>

<style lang="postcss" scoped>
.manage-wrapper {
    padding: 0 1rem 1rem;

    .name-form {
        @apply w-1/3;
        .name-input {
            @apply w-full;
        }
    }
    .selection-type-form {
        @apply w-1/3;
        .selection-type-dropdown {
            @apply w-full;
        }
    }

    .options-wrapper {
        @apply bg-gray-100 rounded-md w-1/2;
        padding: 0.5rem;

        .option-add-button {
            margin-bottom: 0.5rem;
        }
        .draggable-wrapper {
            @apply border border-gray-200 rounded flex flex-col bg-white;
            padding: 0.75rem 0.375rem;
            gap: 0.5rem;
            .draggable-item {
                @apply flex items-center bg-white;
                .grab-area {
                    cursor: grab;
                    &:active {
                        cursor: grabbing;
                    }
                }
                .option-input {
                    @apply w-full;
                }
                .option-delete-area {
                    width: 2rem;
                    height: 2rem;
                }
            }
            .ghost {
                @apply bg-blue-200;
            }
        }
    }
    .button-wrapper {
        @apply flex w-full;
        gap: 1rem;
        padding-top: 1rem;
    }

    @screen tablet {
        .name-form {
            @apply w-full;
        }
        .selection-type-form {
            @apply w-full;
        }
        .options-wrapper {
            @apply w-full;
        }
    }
}
</style>
