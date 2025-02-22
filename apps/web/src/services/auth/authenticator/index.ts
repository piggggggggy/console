import { LocalStorageAccessor } from '@cloudforet/core-lib/local-storage-accessor';

import { SpaceRouter } from '@/router';
import type { AuthType } from '@/schema/identity/user/type';
import { store } from '@/store';
import { setI18nLocale } from '@/translations';

import { useWorkspaceStore } from '@/store/app-context/workspace/workspace-store';


abstract class Authenticator {
    static async signIn(credentials: Record<string, any>, authType: AuthType, verifyCode?: string): Promise<void> {
        const workspaceStore = useWorkspaceStore();
        await store.dispatch('user/signIn', {
            domainId: store.state.domain.domainId,
            credentials,
            authType,
            verify_code: verifyCode,
        });
        await Promise.allSettled([
            // INIT REFERENCE STORE
            store.dispatch('reference/loadAll', { force: true }),
            setI18nLocale(store.state.user.language),
        ]);
        await workspaceStore.load(store.state.user.userId);
        await store.dispatch('display/hideSignInErrorMessage');
        await store.dispatch('error/resetErrorState');
    }

    static async signOut(): Promise<void> {
        try {
            if (SpaceRouter.router) {
                await store.dispatch('user/signOut');
                await store.dispatch('display/hideSignInErrorMessage');
                LocalStorageAccessor.removeItem('hideNotificationEmailModal');
                await store.dispatch('error/resetErrorState');
            }
        } catch (e: unknown) {
            console.error('user sign out failed', e);
        }
    }
}

export {
    Authenticator,
};
