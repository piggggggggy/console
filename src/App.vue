<!--<script setup lang="ts">-->
<!--// import {-->
<!--//     computed,-->
<!--//     reactive, toRefs,-->
<!--// } from 'vue';-->
<!--// import { useI18n } from 'vue-i18n';-->
<!--// import type { Location } from 'vue-router';-->
<!--// import { useRoute } from 'vue-router';-->

<!--// import {-->
<!--//     PNoticeAlert, PToastAlert, PIconModal, PSidebar,-->
<!--// } from '@spaceone/design-system';-->
<!--//-->
<!--// import { SpaceRouter } from '@/router';-->
<!--// import { store } from '@/store';-->
<!--//-->
<!--// import { SIDEBAR_TYPE } from '@/store/modules/display/config';-->
<!--//-->
<!--// import { getRouteAccessLevel } from '@/lib/access-control';-->
<!--// import { ACCESS_LEVEL } from '@/lib/access-control/config';-->
<!--// import { supportsBrowser } from '@/lib/helper/cross-browsing-helper';-->

<!--// import RecommendedBrowserModal from '@/common/modules/modals/RecommendedBrowserModal.vue';-->
<!--// import GNB from '@/common/modules/navigations/gnb/GNB.vue';-->
<!--// import NoticePopup from '@/common/modules/popup/notice/NoticePopup.vue';-->
<!--// import TopNotification from '@/common/modules/portals/TopNotification.vue';-->
<!--//-->
<!--// import MobileGuideModal from '@/services/auth/reset-password/MobileGuideModal.vue';-->
<!--// import { AUTH_ROUTE } from '@/services/auth/route-config';-->
<!--// import SurveyModal from '@/common/modules/survey/SurveyModal.vue';-->



<!--// export default {-->
<!--//     name: 'App',-->
<!--//     components: {-->
<!--//         // NoticePopup,-->
<!--//         // MobileGuideModal,-->
<!--//         // SurveyModal,-->
<!--//         // RecommendedBrowserModal,-->
<!--//         // TopNotification,-->
<!--//         // GNB: GNB as any,-->
<!--//         // PNoticeAlert,-->
<!--//         // PToastAlert,-->
<!--//         // PIconModal: PIconModal as any,-->
<!--//         // PSidebar,-->
<!--//     },-->
<!--//     setup() {-->
<!--//         // const { t } = useI18n();-->
<!--//         // const route = useRoute();-->
<!--//-->
<!--//         // const state = reactive({-->
<!--//         //     showGNB: computed(() => route.matched[0]?.name === 'root'),-->
<!--//         //     isExpired: computed(() => store.state.error.visibleSessionExpiredError && getRouteAccessLevel(route) >= ACCESS_LEVEL.AUTHENTICATED),-->
<!--//         // });-->
<!--//-->
<!--//         // const goToSignIn = () => {-->
<!--//         //     const res: Location = {-->
<!--//         //         name: AUTH_ROUTE.SIGN_OUT._NAME,-->
<!--//         //         query: { nextPath: route.fullPath },-->
<!--//         //     };-->
<!--//         //     SpaceRouter.router.push(res);-->
<!--//         //     store.commit('error/setVisibleSessionExpiredError', false);-->
<!--//         // };-->
<!--//         // const showsBrowserRecommendation = () => !supportsBrowser() && !window.localStorage.getItem('showBrowserRecommendation');-->
<!--//-->
<!--//         return {-->
<!--//             // ...toRefs(state),-->
<!--//             // goToSignIn,-->
<!--//             // SIDEBAR_TYPE,-->
<!--//             // showsBrowserRecommendation,-->
<!--//             // t,-->
<!--//         };-->
<!--//     },-->
<!--// };-->

<!--</script>-->

<!--<template>-->
<!--    <div v-cloak-->
<!--         id="app"-->
<!--    />-->
<!--</template>-->

<!--<style lang="postcss">-->
<!--#app {-->
<!--    display: flex;-->
<!--    flex-direction: column;-->
<!--    overflow-y: hidden;-->
<!--    width: 100vw;-->
<!--    height: 100vh;-->
<!--    background-color: $bg-color;-->

<!--    .gnb {-->
<!--        position: fixed;-->
<!--        width: 100%;-->
<!--        height: $gnb-height;-->
<!--        z-index: 100;-->
<!--        flex-shrink: 0;-->
<!--        top: 0;-->
<!--    }-->
<!--    .app-body {-->
<!--        display: flex;-->
<!--        flex-wrap: wrap;-->
<!--        flex-direction: column;-->
<!--        overflow-y: hidden;-->
<!--        width: 100%;-->
<!--        height: calc(100vh - $(gnb-height));-->
<!--        margin-top: $gnb-height;-->
<!--        flex-grow: 1;-->
<!--        .p-sidebar .non-sidebar-wrapper {-->
<!--            min-height: 100%;-->
<!--        }-->
<!--        .main {-->
<!--            display: flex;-->
<!--            flex-direction: column;-->
<!--            height: 100%;-->
<!--            margin: 0;-->
<!--            overflow-x: hidden;-->
<!--            overflow-y: auto;-->
<!--        }-->
<!--    }-->
<!--}-->
<!--</style>-->

<script setup lang="ts">

</script>

<template>
    <div v-cloak
         id="app"
    >
        테스트욤
    </div>
</template>

<style lang="postcss">

</style>
