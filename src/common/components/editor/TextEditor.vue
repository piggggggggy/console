<template>
    <div v-if="editor"
         class="text-editor"
         :class="{invalid: invalid}"
    >
        <menu-bar :editor="editor" />
        <editor-content class="editor-content"
                        :editor="editor"
        />
    </div>
</template>

<script setup lang="ts">

import {
    watch,
} from 'vue';

import { Color } from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import StarterKit from '@tiptap/starter-kit';
import type { Editor } from '@tiptap/vue-3';
import { EditorContent, useEditor } from '@tiptap/vue-3';

import { createImageExtension } from '@/common/components/editor/extensions/image';
import { getAttachments, setAttachmentsToContents } from '@/common/components/editor/extensions/image/helper';
import type { Attachment, ImageUploader } from '@/common/components/editor/extensions/image/type';
import MenuBar from '@/common/components/editor/MenuBar.vue';

import { loadMonospaceFonts } from '@/styles/fonts';

interface Props {
    value: string;
    imageUploader: ImageUploader;
    attachments: Attachment[];
    invalid: boolean;
}

interface EmitFn {
    (e: 'update:value', value: string): void;
    (e: 'update:attachments', value: Attachment[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<EmitFn>();

loadMonospaceFonts();

const editor = useEditor({
    content: setAttachmentsToContents(props.value, props.attachments),
    extensions: [
        StarterKit.configure({
            heading: {
                levels: [1, 2, 3],
            },
            code: {
                HTMLAttributes: {
                    class: 'inline-code',
                },
            },
        }),
        Underline,
        Link,
        TextStyle,
        Color,
        TextAlign.configure({
            types: ['heading', 'paragraph'],
        }),
        createImageExtension(props.imageUploader),
    ],
    onUpdate: () => {
        emit('update:value', editor.value?.getHTML() ?? '');
        emit('update:attachments', editor?.value ? getAttachments(editor as Editor) : []);
    },
});

watch([() => props.value, () => props.attachments], ([value, attachments], prev) => {
    if (!editor) return;
    const isSame = editor.value?.getHTML() === value;
    if (isSame) return;
    let newContents = value;
    if (attachments !== prev[1]) newContents = setAttachmentsToContents(value, attachments);
    editor.value?.commands.setContent(newContents, false);
});



</script>

<style lang="postcss">
@import './text-editor-nodes.pcss';
.text-editor {
    > .editor-content {
        .ProseMirror {
            @mixin all-nodes-style;
            min-height: inherit;
            &:focus {
                @apply outline-none;
            }
        }
    }
}
</style>
<style lang="postcss" scoped>
.text-editor {
    @apply bg-white border border-gray-200 rounded-lg;
    min-height: 356px;
    > .editor-content {
        min-height: inherit;
        padding: 0.75rem 1rem 1.125rem 1rem;
    }
    &:focus-within {
        @apply border-secondary;
    }
    &.invalid {
        @apply border-alert;
    }
}
</style>
