import type { Vue } from 'vue';

import type { AccessInfo } from '@/lib/access-control/config';

declare module 'vue-router' {
    import type { TranslateResult } from 'vue-i18n';
  import type {
      RouteRecordMultipleViews as OriginRouteRecordMultipleViews,
      RouteRecordSingleView as OriginRouteRecordSingleView,
      RouteMeta as OriginRouteMeta,
      Router as OriginRouter,
      RouteLocationNormalized as OriginRouteLocationNormalized,
      RouteLocationNormalizedLoaded as OriginRouteLocationNormalizedLoaded,
      RouteLocation as OriginRouteLocation,
  } from 'vue-router';

    import type { AccessLevel } from '@/lib/access-control/config';

    import type { Breadcrumb } from '@/common/modules/page-layouts/type';

  interface RouteLabelFormatter {
    (route: RouteLocationNormalized): TranslateResult|TranslateResult[];
  }
  interface RouteTranslationIdFormatter {
    (route: RouteLocationNormalized): string|string[];
  }
  interface RouteBreadcrumbsFormatter {
      (route: RouteLocationNormalized): Breadcrumb[];
  }
  export interface RouteMeta extends OriginRouteMeta {
    lnbVisible?: boolean;
    menuId?: string;
    label?: string|RouteLabelFormatter;
    translationId?: string|RouteTranslationIdFormatter;
    breadcrumbs?: RouteBreadcrumbsFormatter;
    copiable?: boolean; // for breadcrumbs
    isSignInPage?: boolean;
    accessLevel?: AccessLevel;
    accessInfo?: AccessInfo;
  }
  export interface RouteRecordSingleView extends OriginRouteRecordSingleView {
      meta?: RouteMeta;
      children?: RouteRecordRaw[];
  }
  export interface RouteRecordMultipleViews extends OriginRouteRecordMultipleViews {
      meta?: RouteMeta;
      children?: RouteRecordRaw[];
  }
  export type RouteRecordRaw = RouteRecordSingleView | RouteRecordMultipleViews;
  export interface RouteLocationNormalized extends OriginRouteLocationNormalized {
      meta?: RouteMeta;
      name: string;
  }
  export interface RouteLocationNormalizedLoaded extends OriginRouteLocationNormalizedLoaded {
      meta?: RouteMeta;
      name: string;
  }
  export interface RouteLocation extends OriginRouteLocation {
      meta?: RouteMeta;
      name: string;
  }
  export type RouteLegacy = RouteLocation | RouteLocationNormalized | RouteLocationNormalizedLoaded;
  export interface Router extends OriginRouter {
      app: Vue;
  }
  export {
      RouterMode,
      RawLocation,
      RedirectOption,
      RouterOptions,
      RouteRecordPublic,
      Location,
      NavigationGuard,
      NavigationGuardNext,
      NavigationFailureType,
      NavigationFailure,
  } from 'vue-router/dist/vue-router';
}
