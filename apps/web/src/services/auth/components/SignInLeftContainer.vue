<template>
    <div
        class="sign-in-left-container"
        :class="{ admin: props.isDomainAdmin }"
    >
        <div class="lottie-wrapper">
            <img
                v-if="state.signInImage"
                :src="state.signInImage"
            >
            <lottie-vue-player v-else
                               autoplay
                               loop
                               :src="props.isDomainAdmin ? '/lottiefiles/lottie_planet_signin.json' : '/lottiefiles/lottie_floating-astronaut_signin.json'"
                               :style="{ height: '100%', backgroundColor: 'transparent' }"
            />
        </div>
        <div class="version">
            <p-badge style-type="primary"
                     badge-type="solid-outline"
                     shape="square"
            >
                {{ $t('COMMON.SIGN_IN.VERSION') }} {{ state.version }}
            </p-badge>
            <span class="help-msg">{{ $t('COMMON.SIGN_IN.NEED_HELP') }}
                <a :href="state.contactLink ? state.contactLink : 'mailto:support@cloudforet.io'"
                   target="_blank"
                >
                    <span class="text-blue-700 ml-2">{{ $t('COMMON.SIGN_IN.CONTACT') }}</span>
                </a>
            </span>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, reactive } from 'vue';

import { PBadge } from '@spaceone/design-system';

import { store } from '@/store';

import config from '@/lib/config';

interface Props {
    isDomainAdmin: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    isDomainAdmin: false,
});

const state = reactive({
    // eslint-disable-next-line no-undef
    version: VITE_APP_VER,
    signInImage: computed(() => {
        const domainSettings = store.state.domain.config?.settings;
        if (domainSettings?.login_page_image_url) {
            return domainSettings.login_page_image_url;
        }
        return config.get('DOMAIN_IMAGE.SIGN_IN');
    }),
    contactLink: computed(() => config.get('CONTACT_LINK')),
});
</script>

<style lang="postcss" scoped>
.sign-in-left-container {
    @apply bg-primary4;
    display: none;
    flex-direction: column;
    justify-content: space-between;
    width: 33%;
    height: 100%;

    &.admin {
        background-color: rgba(theme('colors.primary3'), 0.3);
    }

    .lottie-wrapper {
        @apply flex justify-center items-center;
        width: 80%;
        max-width: 42.625rem;
        margin: auto;
    }

    .version {
        display: inline-flex;
        align-items: center;
        margin-left: 2.5rem;
        margin-bottom: 2.5rem;
        line-height: 140%;
        .help-msg {
            @apply text-gray-500;
            display: inline-flex;
            align-items: center;
            font-size: 0.875rem;
            margin-left: 1rem;
        }
    }

    @screen md {
        display: flex;
    }
}
</style>
