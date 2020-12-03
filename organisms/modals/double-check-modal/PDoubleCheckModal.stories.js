import { select, text } from '@storybook/addon-knobs/vue';
import { action } from '@storybook/addon-actions';
import PButton from '@/components/atoms/buttons/PButton.vue';
import { ref } from '@vue/composition-api';
import PDoubleCheckModal from '@/components/organisms/modals/double-check-modal/PDoubleCheckModal.vue';

export default {
    title: 'others/double-check-modal',
    component: PDoubleCheckModal,
};

const actions = {
    shown: action('shown'),
    hidden: action('hidden'),
    cancel: action('cancel'),
    close: action('close'),
    confirm: action('confirm'),

};


export const modal = () => ({
    components: { PDoubleCheckModal, PButton },
    template: `
<div>
<p-button styleType="primary" @click="click">모달 띄우기</p-button>
<PDoubleCheckModal
    :headerTitle="headerTitle"
    :subTitle="subTitle"
    :visible.sync="visible"
    :verificationText="verificationText"

    @cancel="cancel"
    @close="close"
    @confirm="confirm"
    >
    
</PDoubleCheckModal>
</div>`,
    props: {
        headerTitle: {
            default: text('header', 'this is header'),
        },
        subTitle: {
            default: text('sub', 'this is sub Title'),
        },
        verificationText: {
            default: text('verification Text', 'verification'),
        },

    },
    setup(props, context) {
        const visible = ref(false);
        return {
            visible,
            click() {
                visible.value = true;
            },
            close() {
                visible.value = false;
            },
            ...actions,
        };
    },
});
