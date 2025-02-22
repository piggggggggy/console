import type { RouteConfig } from 'vue-router';

import { store } from '@/store';

import { ACCESS_LEVEL } from '@/lib/access-control/config';
import { getRedirectRouteByPagePermission } from '@/lib/access-control/redirect-route-helper';
import { MENU_ID } from '@/lib/menu/config';

import { ADMINISTRATION_ROUTE } from '@/services/administration/routes/route-constant';

const AdministrationContainer = () => import('@/services/administration/AdministrationContainer.vue');

const UserMainPage = () => import('@/services/administration/pages/UserMainPage.vue');
const AppMainPage = () => import('@/services/administration/pages/AppMainPage.vue');

const administrationRoutes: RouteConfig = {
    path: 'iam',
    name: ADMINISTRATION_ROUTE.IAM._NAME,
    meta: { menuId: MENU_ID.IAM, lnbVisible: true, accessLevel: ACCESS_LEVEL.WORKSPACE_PERMISSION },
    redirect: (to) => getRedirectRouteByPagePermission(to, store.getters['user/pageAccessPermissionMap']),
    component: AdministrationContainer,
    children: [
        {
            path: 'user',
            name: ADMINISTRATION_ROUTE.IAM.USER._NAME,
            meta: { lnbVisible: true, menuId: MENU_ID.USER },
            component: UserMainPage as any,
        },
        {
            path: 'app',
            name: ADMINISTRATION_ROUTE.IAM.APP._NAME,
            meta: { lnbVisible: true, menuId: MENU_ID.APP },
            component: AppMainPage as any,
        },
    ],
};
export default administrationRoutes;
