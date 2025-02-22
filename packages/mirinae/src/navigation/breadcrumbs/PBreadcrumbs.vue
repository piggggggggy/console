<script setup lang="ts">
import { reactive } from 'vue';

import type { Location } from 'vue-router';

import PI from '@/foundation/icons/PI.vue';
import PCopyButton from '@/inputs/buttons/copy-button/PCopyButton.vue';
import type { Route } from '@/navigation/breadcrumbs/type';


interface Props {
    routes: Route[];
    copiable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    routes: () => [],
    copiable: false,
});

const state = reactive({
    isShown: false,
});
const getLocation = (route: Route): Location => {
    if (route.to) return route.to;
    if (route.path) return { path: route.path };
    return {};
};
const showHidden = () => { state.isShown = true; };
const isLengthOverFive = (idx) => props.routes.length < 5 || (props.routes.length >= 5 && (idx < 1 || idx > props.routes.length - 3)) || state.isShown;
</script>

<template>
    <div class="p-breadcrumbs">
        <span v-for="(route, idx) in props.routes"
              :key="idx"
              class="breadcrumb-container"
        >
            <span v-if="isLengthOverFive(idx)"
                  class="breadcrumb-wrapper"
            >
                <span v-if="route.to || route.path"
                      class="breadcrumb"
                >
                    <router-link :to="getLocation(route)">
                        <span v-if="idx !== props.routes.length - 1"
                              class="link"
                        >{{ route.name }}</span>
                        <span v-else
                              class="current-page"
                        >
                            <span>{{ route.name }}</span>
                            <p-copy-button v-if="props.copiable"
                                           :value="route.name"
                            />
                        </span>
                    </router-link>
                    <span v-if="idx < props.routes.length - 1">
                        <p-i name="ic_chevron-right-thin"
                             width="1rem"
                             height="1rem"
                             class="arrow-icon"
                             color="inherit white"
                        />
                    </span>
                </span>
                <span v-else
                      class="breadcrumb"
                >
                    <span v-if="idx !== props.routes.length - 1"
                          class="link"
                          @click="$emit('click', route, idx)"
                    >{{ route.name }}</span>
                    <span v-else
                          class="current-page"
                    >
                        <span>{{ route.name }}</span>
                        <p-copy-button v-if="props.copiable"
                                       :value="route.name"
                        />
                    </span>
                    <span v-if="idx < props.routes.length - 1">
                        <p-i name="ic_chevron-right-thin"
                             width="1rem"
                             height="1rem"
                             class="arrow-icon"
                             color="inherit white"
                        />
                    </span>
                </span>
            </span>
            <span v-if="props.routes.length >= 5 && idx === 2 && !state.isShown"
                  class="breadcrumb-wrapper truncated"
            >
                <span class="link"
                      @click="showHidden"
                >...</span>
                <p-i name="ic_chevron-right-thin"
                     width="1rem"
                     height="1rem"
                     class="arrow-icon"
                     color="inherit white"
                />
            </span>
        </span>
    </div>
</template>

<style lang="postcss">
.p-breadcrumbs {
    .breadcrumb-container {
        @apply inline-flex items-center;
        .breadcrumb-wrapper {
            margin-right: 0.375rem;
            word-break: break-all;
            .breadcrumb, &.truncated {
                @apply flex items-center;
                gap: 0.375rem;
            }
        }
        .link {
            @apply text-xs text-gray-700 cursor-pointer;

            &:hover {
                @apply text-gray-900 underline;
            }
        }
        .current-page {
            @apply text-xs text-gray-900 cursor-default;
            > .p-copy-button {
                font-size: inherit;
                margin-left: 0.25rem;
                vertical-align: 0.1rem;
            }
        }
        .arrow-icon {
            @apply text-gray-500;
        }
    }
}
</style>
