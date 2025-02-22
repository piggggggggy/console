<template>
    <div v-if="channelFormatter(notificationLevel).length > 0"
         class="project-channel-list"
    >
        <div v-for="(channel, cIdx) in channelFormatter(notificationLevel)"
             :key="`channel-${cIdx}`"
             :class="{ disabled: channel.state === CHANNEL_STATE.DISABLED }"
             class="channel-wrapper"
        >
            <p class="title">
                [{{ protocolNameFormatter(channel.protocol_id) }}] {{ channel.name }}
                <span class="on-off">
                    <p-i name="ic_gnb_bell"
                         color="inherit"
                         class="ml-1"
                         width="1rem"
                         height="1rem"
                    />
                    {{ channel.state === CHANNEL_STATE.ENABLED ? 'ON' : 'OFF' }}
                </span>
            </p>
            <template v-if="Array.isArray(channel.data)">
                <p v-for="(user, uIdx) in channel.data.users"
                   :key="`user-${uIdx}`"
                   class="info"
                >
                    {{ user }}
                </p>
            </template>
        </div>
    </div>
</template>

<script lang="ts">
import { computed, reactive, toRefs } from 'vue';

import { PI } from '@spaceone/design-system';
import { get, filter } from 'lodash';

import { store } from '@/store';

import type { ProtocolReferenceMap } from '@/store/modules/reference/protocol/type';

const CHANNEL_STATE = Object.freeze({
    ENABLED: 'ENABLED',
    DISABLED: 'DISABLED',
});

export default {
    name: 'ProjectChannelList',
    components: {
        PI,
    },
    props: {
        projectChannels: {
            type: Array,
            default: () => ([]),
        },
        notificationLevel: {
            type: String,
            default: undefined,
        },
    },
    setup(props) {
        const state = reactive({
            protocols: computed<ProtocolReferenceMap>(() => store.getters['reference/protocolItems']),
        });

        const channelFormatter = (level?: string) => {
            if (level === 'ALL') {
                return props.projectChannels;
            }
            return filter(props.projectChannels, { notification_level: level });
        };
        const protocolNameFormatter = (protocolId) => {
            const protocolName = get(state.protocols, protocolId);
            return protocolName ? protocolName.label : protocolId;
        };

        // LOAD REFERENCE STORE
        (async () => {
            await store.dispatch('reference/protocol/load');
        })();

        return {
            ...toRefs(state),
            CHANNEL_STATE,
            channelFormatter,
            protocolNameFormatter,
        };
    },
};
</script>

<style lang="postcss" scoped>
.project-channel-list {
    @apply bg-white rounded;
    font-size: 0.75rem;
    line-height: 1.5;
    padding: 0.5rem;
    margin-top: 0.375rem;

    .channel-wrapper {
        padding-bottom: 0.25rem;
        .title {
            @apply text-blue-900;
            display: flex;
            font-weight: bold;
            .on-off {
                flex-shrink: 0;
            }
        }
        .info {
            @apply text-gray-700;
        }

        &.disabled {
            .title {
                @apply text-gray-300;
            }
            .info {
                @apply text-gray-300;
            }
        }
    }
}
</style>
