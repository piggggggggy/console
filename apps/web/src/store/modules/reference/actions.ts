import type { Action } from 'vuex';

import type { ReferenceLoadOptions, ReferenceRootState } from '@/store/modules/reference/type';
// eslint-disable-next-line import/no-cycle
import { useAllReferenceStore } from '@/store/reference/all-reference-store';

export const loadAll: Action<ReferenceRootState, any> = async ({ dispatch, commit }, options: ReferenceLoadOptions): Promise<void|Error> => {
    commit('setIsAllLoaded', false);
    await Promise.allSettled([
        dispatch('cloudServiceType/load', options),
        dispatch('collector/load', options),
        dispatch('plugin/load', options),
        dispatch('protocol/load', options),
        dispatch('provider/load', options),
        dispatch('region/load', options),
        dispatch('secret/load', options),
        dispatch('serviceAccount/load', options),
        dispatch('webhook/load', options),
    ]);
    commit('setIsAllLoaded', true);
};


export const initializeAllReference: Action<ReferenceRootState, any> = async ({ dispatch }): Promise<void> => {
    const allReferenceStore = useAllReferenceStore();
    await dispatch('reference/loadAll', { force: true });
    allReferenceStore.flush();
};
