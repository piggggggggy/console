import { SIDEBAR_TYPE } from '@/store/modules/display/config';

import * as actions from './actions';
import * as getters from './getters';
import * as mutations from './mutations';
import type { DisplayState } from './type';

const state: DisplayState = {
    isAdminMode: false,
    visibleSidebar: false,
    sidebarType: SIDEBAR_TYPE.info,
    isInitialized: false,
    uncheckedNotificationCount: 0,
    isSignInFailed: false,
    visibleMobileGuideModal: false,
};

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations,
};
