import type { App } from 'vue';

import ErrorHandler from '@/common/composables/error/errorHandler';

export const initErrorHandler = (store, app: App) => {
    app.config.errorHandler = (error) => ErrorHandler.handleError(error);
    ErrorHandler.init({
        authenticationErrorHandler: () => {
            store.dispatch('error/showSessionExpiredError');
            store.dispatch('user/setIsSessionExpired', true);
        },
        authorizationErrorHandler: () => {
            store.dispatch('error/showAuthorizationError');
        },
    });
};
