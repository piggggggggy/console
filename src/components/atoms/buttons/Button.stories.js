import { select, text } from '@storybook/addon-knobs/vue';
import { action } from '@storybook/addon-actions';
import PButton from './Button.vue';
import { autoProps } from '../../../setup/storybook-util';

export default {
    title: 'atoms/buttons/button',
    component: PButton,
    parameters: {
        info: {
            summary: '',
            components: { PButton },
        },
    },
};
const actions = {
    click: action('click'),
};
const data = {};

export const base = () => ({
    components: { PButton },
    template: `
<p-button
        @click="click"
        :href="href" 
        :styleType="styleType" 
        :size="size"
        :disabled="disabled"
        :outline="outline"
        :link="link"
        :shpae="shape"
        >
       {{defaultSlot}} 
</p-button>`,
    data() {
        return {
            ...data,
        };
    },
    props: {
        styleType: {
            default: select('styleType', [
                null, 'primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark',
            ], null),
        },
        size: {
            default: select('size', [null, 'sm', 'lg'], null),
        },
        shape: {
            default: select('shape', [null, 'circle'], null),
        },
        defaultSlot: {
            default: text('default slot', 'button', 'slot'),
        },
        ...autoProps(PButton, [
            { name: 'href' },
            { name: 'disabled' },
            { name: 'outline' },
            { name: 'link' },
        ]),
    },
    methods: {
        ...actions,
    },
});


export const block = () => ({
    components: { PButton },
    template: `
<div style="width: 600px;height: 100px;border: #1a1f3e solid 1px;">
<p-button
        @click="click"
        :href="href" 
        :styleType="styleType" 
        :size="size" 
        :disabled="disabled"
        :outline="outline"
        :link="link"
        :block="block"
        :shpae="shape"
        >
       {{defaultSlot}} 
</p-button>
</div>`,
    data() {
        return {
            ...data,
        };
    },
    props: {
        styleType: {
            default: select('styleType', [
                null, 'primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark',
            ], 'primary'),
        },
        size: {
            default: select('size', [null, 'sm', 'lg'], null),
        },
        shape: {
            default: select('shape', [null, 'circle'], null),
        },
        defaultSlot: {
            default: text('default slot', 'button', 'slot'),
        },
        ...autoProps(PButton, [
            { name: 'href' },
            { name: 'disabled' },
            { name: 'outline' },
            { name: 'link' },
            { name: 'block', default: true },
        ]),
    },
    methods: {
        ...actions,
    },
});
