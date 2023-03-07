<template>
    <div v-cloak
         id="app"
    >
        <!--        <template v-if="$store.state.display.isInitialized">-->
        <!--            <p-notice-alert group="noticeTopLeft" />-->
        <!--            <p-notice-alert group="noticeTopRight" />-->
        <!--            <p-notice-alert group="noticeBottomLeft" />-->
        <!--            <p-notice-alert group="noticeBottomRight" />-->
        <!--            <p-toast-alert group="toastTopCenter" />-->
        <!--            <top-notification />-->
        <!--            <template v-if="showGNB">-->
        <!--                <g-n-b class="gnb" />-->
        <!--                <div class="app-body">-->
        <!--                    <p-sidebar :visible="$store.state.display.visibleSidebar"-->
        <!--                               :style-type="$store.getters['display/sidebarProps'].styleType"-->
        <!--                               :size="$store.getters['display/sidebarProps'].size"-->
        <!--                               :is-fixed-size="$store.getters['display/sidebarProps'].isFixedSize"-->
        <!--                               :hide-close-button="$store.getters['display/sidebarProps'].disableButton"-->
        <!--                               :disable-scroll="$store.getters['display/sidebarProps'].disableScroll"-->
        <!--                               @close="$store.dispatch('display/hideSidebar')"-->
        <!--                    >-->
        <!--                        <main class="main">-->
        <!--                            &lt;!&ndash;                            <portal-target name="top-notification"&ndash;&gt;-->
        <!--                            &lt;!&ndash;                                           :slot-props="{hasDefaultMessage: true}"&ndash;&gt;-->
        <!--                            &lt;!&ndash;                            />&ndash;&gt;-->
        <!--                            <router-view />-->
        <!--                        </main>-->
        <!--                        <template #title>-->
        <!--                            &lt;!&ndash;                            <portal-target v-if="$store.state.display.sidebarType === SIDEBAR_TYPE.info"&ndash;&gt;-->
        <!--                            &lt;!&ndash;                                           name="info-title"&ndash;&gt;-->
        <!--                            &lt;!&ndash;                            />&ndash;&gt;-->
        <!--                            &lt;!&ndash;                            <portal-target v-else-if="$store.state.display.sidebarType === SIDEBAR_TYPE.widget"&ndash;&gt;-->
        <!--                            &lt;!&ndash;                                           name="widget-title"&ndash;&gt;-->
        <!--                            &lt;!&ndash;                            />&ndash;&gt;-->
        <!--                            &lt;!&ndash;                            <portal-target v-else&ndash;&gt;-->
        <!--                            &lt;!&ndash;                                           name="handbook-title"&ndash;&gt;-->
        <!--                            &lt;!&ndash;                            />&ndash;&gt;-->
        <!--                        </template>-->
        <!--                        <template #sidebar>-->
        <!--                            &lt;!&ndash;                            <portal-target v-if="$store.state.display.sidebarType === SIDEBAR_TYPE.info"&ndash;&gt;-->
        <!--                            &lt;!&ndash;                                           name="info-contents"&ndash;&gt;-->
        <!--                            &lt;!&ndash;                            />&ndash;&gt;-->
        <!--                            &lt;!&ndash;                            <portal-target v-else-if="$store.state.display.sidebarType === SIDEBAR_TYPE.widget"&ndash;&gt;-->
        <!--                            &lt;!&ndash;                                           name="widget-contents"&ndash;&gt;-->
        <!--                            &lt;!&ndash;                            />&ndash;&gt;-->
        <!--                            &lt;!&ndash;                            <portal-target v-else&ndash;&gt;-->
        <!--                            &lt;!&ndash;                                           name="handbook-contents"&ndash;&gt;-->
        <!--                            &lt;!&ndash;                            />&ndash;&gt;-->
        <!--                        </template>-->
        <!--                        <template #footer>-->
        <!--                            &lt;!&ndash;                            <portal-target name="widget-footer" />&ndash;&gt;-->
        <!--                        </template>-->
        <!--                    </p-sidebar>-->
        <!--                </div>-->
        <!--            </template>-->
        <!--            <router-view v-else />-->
        <!--            <p-icon-modal :visible="isExpired"-->
        <!--                          emoji="👋"-->
        <!--                          :header-title="t('COMMON.SESSION_MODAL.SESSION_EXPIRED')"-->
        <!--                          :button-text="t('COMMON.SESSION_MODAL.SIGNIN')"-->
        <!--                          button-type="primary"-->
        <!--                          @clickButton="goToSignIn"-->
        <!--            />-->
        <!--            <notice-popup v-if="!$store.getters['user/hasSystemRole']" />-->
        <!--            &lt;!&ndash;            <survey-modal />&ndash;&gt;-->
        <!--        </template>-->
        <!--        &lt;!&ndash; Iframe for file download &ndash;&gt;-->
        <!--        <iframe class="hidden"-->
        <!--                :src="$store.state.file.downloadSource"-->
        <!--                width="1"-->
        <!--                height="1"-->
        <!--        />-->
        <!--        &lt;!&ndash; Modal for Cross Browsing &ndash;&gt;-->
        <!--        <recommended-browser-modal v-if="showsBrowserRecommendation()" />-->
        <!--        <mobile-guide-modal v-if="$store.state.display.visibleMobileGuideModal" />-->
    </div>
</template>

<script lang="ts">
// import {
//     computed,
//     defineComponent, getCurrentInstance, reactive, toRefs,
// } from 'vue';
// import type { Vue } from 'vue/types/vue';
// import { useI18n } from 'vue-i18n';
// import type { Location } from 'vue-router';
//
// import {
//     PNoticeAlert, PToastAlert, PIconModal, PSidebar,
// } from '@spaceone/design-system';
//
// import { store } from '@/store';
//
// import { SIDEBAR_TYPE } from '@/store/modules/display/config';
//
// import { getRouteAccessLevel } from '@/lib/access-control';
// import { ACCESS_LEVEL } from '@/lib/access-control/config';
// import { supportsBrowser } from '@/lib/helper/cross-browsing-helper';
//
// import RecommendedBrowserModal from '@/common/modules/modals/RecommendedBrowserModal.vue';
// import GNB from '@/common/modules/navigations/gnb/GNB.vue';
// import NoticePopup from '@/common/modules/popup/notice/NoticePopup.vue';
// import TopNotification from '@/common/modules/portals/TopNotification.vue';
//
// import MobileGuideModal from '@/services/auth/reset-password/MobileGuideModal.vue';
// import { AUTH_ROUTE } from '@/services/auth/route-config';
// // import SurveyModal from '@/common/modules/survey/SurveyModal.vue';

export default {
    name: 'App',
    components: {
        // NoticePopup,
        // MobileGuideModal,
        // // SurveyModal,
        // RecommendedBrowserModal,
        // TopNotification,
        // GNB: GNB as any,
        // PNoticeAlert,
        // PToastAlert,
        // PIconModal: PIconModal as any,
        // PSidebar,
    },
    setup() {
        // const { t } = useI18n();
        // const vm = getCurrentInstance()?.proxy as Vue;
        //
        // const state = reactive({
        //     showGNB: computed(() => vm.$route.matched[0]?.name === 'root'),
        //     isExpired: computed(() => vm.$store.state.error.visibleSessionExpiredError && getRouteAccessLevel(vm.$route) >= ACCESS_LEVEL.AUTHENTICATED),
        // });
        //
        // const goToSignIn = () => {
        //     const res: Location = {
        //         name: AUTH_ROUTE.SIGN_OUT._NAME,
        //         query: { nextPath: vm.$route.fullPath },
        //     };
        //     vm.$router.push(res);
        //     store.commit('error/setVisibleSessionExpiredError', false);
        // };
        // const showsBrowserRecommendation = () => !supportsBrowser() && !window.localStorage.getItem('showBrowserRecommendation');

        return {
            // ...toRefs(state),
            // goToSignIn,
            // SIDEBAR_TYPE,
            // showsBrowserRecommendation,
            // t,
        };
    },
};

</script>

<style lang="postcss">
#app {
    display: flex;
    flex-direction: column;
    overflow-y: hidden;
    width: 100vw;
    height: 100vh;
    background-color: $bg-color;

    .gnb {
        position: fixed;
        width: 100%;
        height: $gnb-height;
        z-index: 100;
        flex-shrink: 0;
        top: 0;
    }
    .app-body {
        display: flex;
        flex-wrap: wrap;
        flex-direction: column;
        overflow-y: hidden;
        width: 100%;
        height: calc(100vh - $(gnb-height));
        margin-top: $gnb-height;
        flex-grow: 1;
        .p-sidebar .non-sidebar-wrapper {
            min-height: 100%;
        }
        .main {
            display: flex;
            flex-direction: column;
            height: 100%;
            margin: 0;
            overflow-x: hidden;
            overflow-y: auto;
        }
    }
}
</style>
