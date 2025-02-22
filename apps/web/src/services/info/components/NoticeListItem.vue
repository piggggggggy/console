<template>
    <component :is="postDirection ? 'div' : 'li'"
               class="list-item"
               :class="{ 'pointer': !!post }"
    >
        <div v-if="postDirection"
             class="post-direction"
        >
            <span>{{ postDirectionLabel }}</span><p-i :name="postDirectionIcon"
                                                      width="1rem"
            />
        </div>
        <div v-if="isPostExist">
            <div class="title">
                <p-i v-if="isPinned"
                     class="pin"
                     name="ic_pin-filled"
                     width="1.125rem"
                />
                <text-highlighting class="title"
                                   :term="inputText"
                                   :text="post.title"
                />
                <new-mark v-if="isNew"
                          class="new-mark"
                />
            </div>
            <div class="info">
                <span>{{ date }}</span><p-i width="0.125rem"
                                            name="ic_dot"
                />
                <span>{{ post.writer }}</span><p-i v-if="hasDomainRoleUser"
                                                   width="0.125rem"
                                                   name="ic_dot"
                />
                <span v-if="hasDomainRoleUser"
                      class="view-count"
                ><p-i name="ic_eye"
                      width="1.125rem"
                /> {{ post.view_count }}</span>
            </div>
        </div>
        <div v-else
             class="not-exist-item"
        >
            {{ $t('INFO.NOTICE.MAIN.NO_NEXT_LIST') }}
        </div>
    </component>
</template>

<script lang="ts">
import {
    computed, defineComponent, reactive, toRefs,
} from 'vue';
import type { PropType } from 'vue';

import { PBadge, PI } from '@spaceone/design-system';
import dayjs from 'dayjs';

import type { PostModel } from '@/schema/board/post/model';
import { store } from '@/store';
import { i18n } from '@/translations';

import NewMark from '@/common/components/marks/NewMark.vue';
import TextHighlighting from '@/common/components/text/text-highlighting/TextHighlighting.vue';

interface Props {
    inputText: string;
    isNew: boolean;
    postDirection: 'prev' | 'next' | undefined;
    post: PostModel;
}

export default defineComponent<Props>({
    name: 'ListItem',
    components: {
        PBadge,
        PI,
        NewMark,
        TextHighlighting,
    },
    props: {
        post: {
            type: Object as PropType<PostModel|undefined>,
            default: undefined,
        },
        inputText: {
            type: String,
            default: '',
        },
        isNew: {
            type: Boolean,
            default: false,
        },
        postDirection: {
            type: String as PropType<'prev' | 'next' | undefined>,
            default: undefined,
        },
    },
    setup(props) {
        const state = reactive({
            hasDomainRoleUser: computed<boolean>(() => store.getters['user/isDomainAdmin']),
            postDirectionLabel: computed(() => ((props.postDirection === 'prev') ? i18n.t('INFO.NOTICE.MAIN.PREV') : i18n.t('INFO.NOTICE.MAIN.NEXT'))),
            timezone: computed(() => store.state.user.timezone || 'UTC'),
            date: computed(() => dateFormatter(props.post?.created_at)),
            isPinned: computed(() => props.post?.options?.is_pinned),
            isPostExist: computed(() => props.post),
            postDirectionIcon: computed(() => ((props.postDirection === 'prev') ? 'ic_arrow-down' : 'ic_arrow-up')),
        });

        const dateFormatter = (date) => dayjs.tz(dayjs.utc(date), state.timezone).format('YYYY-MM-DD');

        return {
            ...toRefs(state),
        };
    },
});
</script>

<style scoped lang="postcss">
.list-item {
    @apply border-b border-gray-200 flex;
    padding: 1rem;

    &.pointer {
        @media (hover: hover) {
            &:hover {
                @apply bg-blue-100;
                cursor: pointer;
            }
        }
    }

    .title {
        margin-bottom: 0.375rem;
        vertical-align: baseline;
        .pin {
            margin-right: 0.125rem;
            margin-bottom: 0.1875rem;
        }
        .title {
            @apply text-gray-900 font-bold;
            line-height: 1.25;
        }
        .new-mark {
            display: inline-block;
            margin-top: 0.1875rem;
        }
    }
    .info {
        @apply flex flex-wrap gap-2 items-center text-gray-600;
        font-size: 0.875rem;
        line-height: 1.25;
        .view-count {
            @apply flex items-center;
            gap: 0.125rem;
        }
    }

    .not-exist-item {
        @apply text-gray-300;
        font-weight: 700;
        font-size: 0.875rem;
        padding: 0.8125rem 0;
        line-height: 1.25;
        margin-left: 4.3125rem;
    }

    .post-direction {
        @apply flex items-center text-gray-700;
        font-size: 0.75rem;
        line-height: 1.25;
        padding: 1rem 1rem 1rem 0.5rem;
    }
}

.list-item:last-child {
    @apply border-b-0;
}
</style>
