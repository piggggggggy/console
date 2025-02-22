<script setup lang="ts">

import { vOnClickOutside } from '@vueuse/components';
import {
    computed, reactive, ref,
} from 'vue';
import type { Location } from 'vue-router';
import { useRoute, useRouter } from 'vue-router/composables';

import {
    PI, PDivider, PButton,
} from '@spaceone/design-system';
import ejs from 'ejs';

import { ROLE_TYPE } from '@/schema/identity/role/constant';
import { store } from '@/store';
import { i18n } from '@/translations';

import { useAppContextStore } from '@/store/app-context/app-context-store';
import { languages } from '@/store/modules/user/config';

import config from '@/lib/config';
import { showSuccessMessage } from '@/lib/helper/notice-alert-helper';

import ErrorHandler from '@/common/composables/error/errorHandler';

import { AUTH_ROUTE } from '@/services/auth/routes/route-constant';
import { INFO_ROUTE } from '@/services/info/routes/route-constant';
import { MY_PAGE_ROUTE } from '@/services/my-page/routes/route-constant';

interface Props {
    visible: boolean
}

const props = withDefaults(defineProps<Props>(), {
    visible: false,
});
const appContextStore = useAppContextStore();

const emit = defineEmits<{(e: 'update:visible', visible: boolean): void; }>();

const route = useRoute();
const router = useRouter();

const state = reactive({
    userIcon: computed<string>(() => {
        if (store.getters['user/isSystemAdmin']) return 'img_avatar_system-admin';
        if (store.getters['user/isDomainAdmin']) return 'img_avatar_admin';
        const currentRoleType = store.getters['user/getCurrentRoleInfo']?.roleType;
        if (currentRoleType === ROLE_TYPE.WORKSPACE_OWNER) return 'img_avatar_workspace-owner';
        if (currentRoleType === ROLE_TYPE.WORKSPACE_MEMBER) return 'img_avatar_workspace-member';
        return 'img_avatar_no-role';
    }),
    name: computed(() => store.state.user.name),
    email: computed(() => store.state.user.email),
    // TODO: to be refactored by new planning
    role: computed(() => store.getters['user/getCurrentRoleInfo']?.roleType || 'USER'),
    language: computed(() => store.getters['user/languageLabel']),
    timezone: computed(() => store.state.user.timezone),
    domainId: computed(() => store.state.domain.domainId),
    userId: computed(() => store.state.user.userId),
    isMyPage: computed(() => route.matched.some((item) => item.name === MY_PAGE_ROUTE._NAME)),
    languageMenuVisible: false,
    supportedMenu: computed(() => {
        const docsList = config.get('DOCS') ?? [];
        const data = { lang: store.state.user.language };
        return docsList.map((d) => ({
            label: ejs.render(d?.label ?? '', data),
            link: ejs.render(d?.link ?? '', data),
        }));
    }),
    languageMenu: computed(() => Object.entries(languages).map(([k, v]) => ({
        label: v, name: k,
    }))),
    isAdminMode: computed(() => appContextStore.getters.isAdminMode),
});

const profileMenuRef = ref<HTMLElement|null>(null);

const setVisible = (visible: boolean) => {
    emit('update:visible', visible);
};
const openProfileMenu = () => {
    setVisible(true);
};
const hideProfileMenu = () => {
    if (state.languageMenuVisible) state.languageMenuVisible = false;
    setVisible(false);
};
const setLanguageMenuVisible = (visible: boolean) => {
    state.languageMenuVisible = visible;
};
const handleProfileButtonClick = () => {
    setVisible(!props.visible);
};
const handleClickOutsideLanguageMenu = (e: PointerEvent) => {
    if (!profileMenuRef.value) return;
    const target = e.target as HTMLElement;
    setLanguageMenuVisible(false);
    /*
                v-on-click-outside directive stops click event bubbling.
                So when this function is called, hideProfileMenu function will never be called which is bound to profileMenuRef's v-on-click-outside directive.
                The code below closes the profile menu when the user clicks outside the profileMenuRef.
             */
    if (!profileMenuRef.value.contains(target)) hideProfileMenu();
};
const handleLanguageDropdownClick = () => {
    setLanguageMenuVisible(!state.languageMenuVisible);
};

const handleLanguageClick = async (language) => {
    try {
        if (store.state.user.language === language) return;

        await store.dispatch('user/setUser', {
            language,
            timezone: state.timezone,
        });

        setLanguageMenuVisible(false);
        showSuccessMessage(i18n.t('COMMON.GNB.ACCOUNT.ALT_S_UPDATE'), '');
    } catch (e) {
        ErrorHandler.handleRequestError(e, i18n.t('COMMON.GNB.ACCOUNT.ALT_E_UPDATE'));
    }
};

const handleClickSignOut = async () => {
    const res: Location = {
        name: AUTH_ROUTE.SIGN_OUT._NAME,
        query: { nextPath: route.fullPath },
    };
    await router.push(res);
    if (state.isAdminMode) appContextStore.switchToWorkspaceMode();
};
</script>

<template>
    <div ref="profileMenuRef"
         v-on-click-outside="hideProfileMenu"
         class="gnb-profile"
         @keydown.esc="hideProfileMenu"
    >
        <span :class="{'menu-button': true, 'opened': visible}"
              role="button"
              tabindex="0"
              @click.stop="handleProfileButtonClick"
              @keydown.enter="openProfileMenu"
        >
            <p-i :name="state.userIcon"
                 class="menu-icon"
                 width="1.75rem"
                 height="1.75rem"
            />
        </span>
        <div v-if="visible"
             class="profile-menu-wrapper"
        >
            <div class="user-info">
                <p-i :name="state.userIcon" />
                <span class="value">{{ state.userId }}</span>
            </div>
            <div class="info-wrapper">
                <div class="info-menu">
                    <span class="label">{{ $t('IDENTITY.USER.MAIN.DOMAIN_ID') }}</span>
                    <span class="value">{{ state.domainId }}</span>
                </div>
                <div class="info-menu">
                    <span class="label">{{ $t('COMMON.GNB.ACCOUNT.LABEL_ROLE') }}</span>
                    <span class="value">{{ state.role }}</span>
                </div>
                <div v-on-click-outside="handleClickOutsideLanguageMenu"
                     class="info-menu language"
                     @click.stop="handleLanguageDropdownClick"
                >
                    <span class="label">{{ $t('COMMON.GNB.ACCOUNT.LABEL_LANGUAGE') }}</span>
                    <div class="value">
                        <span>{{ state.language }}</span>
                        <div v-if="state.languageMenuVisible"
                             class="language-menu-wrapper"
                        >
                            <div class="sub-menu-wrapper">
                                <div v-for="(item, index) in state.languageMenu"
                                     :key="index"
                                     class="sub-menu"
                                     @click.stop="handleLanguageClick(item.name)"
                                >
                                    <span>{{ item.label }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p-i :name="state.languageMenuVisible ? 'ic_chevron-up' : 'ic_chevron-down'"
                         class="arrow-icon"
                         width="1rem"
                         height="1rem"
                    />
                </div>
                <!-- TODO: This code might need recovery in version 1.13.-->
                <!--                <div v-on-click-outside="handleClickOutsideCurrencyMenu"-->
                <!--                     class="info-menu currency"-->
                <!--                     @click.stop="handleCurrencyDropdownClick"-->
                <!--                >-->
                <!--                    <span class="label">{{ $t('COMMON.GNB.ACCOUNT.LABEL_CURRENCY') }}</span>-->
                <!--                    <div class="value">-->
                <!--                        <span>{{ state.currency }}</span>-->
                <!--                        <div v-if="state.currencyMenuVisible"-->
                <!--                             class="currency-menu-wrapper"-->
                <!--                        >-->
                <!--                            <div class="sub-menu-wrapper">-->
                <!--                                <div v-for="(item, index) in state.currencyMenuItems"-->
                <!--                                     :key="index"-->
                <!--                                     class="sub-menu"-->
                <!--                                     @click.stop="handleCurrencyClick(item.name)"-->
                <!--                                >-->
                <!--                                    <span>{{ item.label }}</span>-->
                <!--                                </div>-->
                <!--                            </div>-->
                <!--                        </div>-->
                <!--                    </div>-->
                <!--                    <p-i :name="state.currencyMenuVisible ? 'ic_chevron-up' : 'ic_chevron-down'"-->
                <!--                         class="arrow-icon"-->
                <!--                         width="1rem"-->
                <!--                         height="1rem"-->
                <!--                    />-->
                <!--                </div>-->
                <div class="info-menu">
                    <span class="label">{{ $t('COMMON.PROFILE.TIMEZONE') }}</span>
                    <span class="value">{{ state.timezone }}</span>
                </div>
                <div class="info-menu">
                    <router-link :to="{name: MY_PAGE_ROUTE._NAME }"
                                 @click.native="hideProfileMenu"
                    >
                        <p-button style-type="secondary"
                                  size="sm"
                                  class="my-page-button"
                        >
                            {{ $t('COMMON.GNB.ACCOUNT.GO_TO_MYPAGE') }}
                        </p-button>
                    </router-link>
                </div>
            </div>
            <template v-if="!state.isMyPage">
                <p-divider />
                <div class="sub-menu-wrapper">
                    <router-link class="sub-menu"
                                 :to="{name: INFO_ROUTE.NOTICE._NAME}"
                                 @click.native="hideProfileMenu"
                    >
                        {{ $t('MENU.INFO_NOTICE') }}
                    </router-link>
                </div>
            </template>
            <p-divider />
            <div class="sub-menu-wrapper">
                <a v-for="{ link, label } in state.supportedMenu"
                   :key="label"
                   class="sub-menu support-menu"
                   :href="link"
                   target="_blank"
                   @click="hideProfileMenu"
                >
                    <span>{{ label }}</span>
                    <p-i name="ic_external-link"
                         height="1em"
                         width="1em"
                         color="inherit"
                         class="external-icon"
                    />
                </a>
            </div>
            <p-divider />
            <div class="sub-menu-wrapper">
                <div class="sub-menu"
                     @click="handleClickSignOut"
                >
                    {{ $t('COMMON.GNB.ACCOUNT.LABEL_SIGN_OUT') }}
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="postcss" scoped>
.gnb-profile {
    position: relative;
    outline: none;

    &:first-of-type {
        margin-left: 0;
    }

    .menu-button {
        @apply inline-flex items-center justify-center text-gray-500 rounded-full;
        width: 2rem;
        height: 2rem;
        cursor: pointer;
        line-height: $gnb-height;

        &:hover {
            @apply text-blue-600 bg-blue-100;
        }

        &.opened {
            @apply text-blue-600 bg-blue-200;
        }

        .menu-icon {
            @apply rounded-full;
        }
    }

    @define-mixin menu-dropdown {
        @apply bg-white border border-gray-200 rounded-xs;
        position: absolute;
        top: 100%;
        right: -0.5rem;
        left: auto;
        z-index: 1000;
        box-shadow: 0 0 0.875rem rgba(0, 0, 0, 0.1);
    }
    .profile-menu-wrapper {
        @mixin menu-dropdown;
        min-width: 19.5rem;

        .user-info {
            @apply flex items-center;
            padding: 1.25rem 1rem 0.25rem;

            .p-i-icon {
                @apply rounded-lg flex-shrink-0;
            }

            .value {
                @apply font-bold break-all;
                margin-left: 0.5rem;
                font-size: 0.875rem;
                line-height: 125%;
            }
        }

        .info-wrapper {
            padding: 0.5rem;

            .info-menu {
                width: 100%;
                padding: 0 0.5rem;
                line-height: 1.5rem;
                font-size: 0.75rem;
                letter-spacing: 0.02em;

                .label {
                    @apply text-gray-500 font-bold;
                    padding-right: 0.5rem;
                }

                .my-page-button {
                    @apply w-full;
                    margin-top: 0.75rem;
                    margin-bottom: 0.5rem;
                }

                &.language, &.currency {
                    display: inline-flex;
                    cursor: pointer;
                    &:hover, &:focus {
                        @apply bg-violet-100 text-violet-600 rounded-xs;
                    }
                    .arrow-icon {
                        display: inline-block;
                        margin-top: 0.25rem;
                    }
                    .value {
                        position: relative;
                        .language-menu-wrapper, .currency-menu-wrapper {
                            @mixin menu-dropdown;
                            left: -1rem;
                            min-width: 9.25rem;
                            max-height: 21rem;
                            margin-top: -0.125rem;
                            overflow-y: auto;
                            z-index: 10;
                        }
                    }
                }
            }
        }

        .sub-menu-wrapper {
            padding: 0.5rem;

            .sub-menu {
                @apply text-gray-900 rounded;
                position: relative;
                display: inline-flex;
                justify-content: space-between;
                align-items: center;
                width: 100%;
                height: 2rem;
                padding: 0 0.5rem;
                font-size: 0.875rem;
                text-decoration: none;
                white-space: nowrap;
                cursor: pointer;

                &:hover, &:focus {
                    @apply bg-violet-100 text-violet-600;
                }

                &:active {
                    @apply bg-white;
                }

                .support-menu {
                    @apply justify-between;
                    display: flex;
                    width: 100%;
                }
            }
        }
    }

    @screen tablet {
        .profile-menu-wrapper {
            width: 13.1875rem;
        }
    }
}

</style>
