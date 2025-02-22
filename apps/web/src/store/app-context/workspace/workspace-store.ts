import { computed, reactive } from 'vue';

import { defineStore } from 'pinia';

import { SpaceConnector } from '@cloudforet/core-lib/space-connector';

import type { ListResponse } from '@/schema/_common/api-verbs/list';
import type { WorkspaceModel } from '@/schema/identity/workspace/model';

interface WorkspaceStoreState {
    items: WorkspaceModel[];
    currentItem?: WorkspaceModel;
}

export const useWorkspaceStore = defineStore('workspace-store', () => {
    const state = reactive<WorkspaceStoreState>({
        items: [],
        currentItem: undefined,
    });

    const getters = reactive({
        workspaceList: computed<WorkspaceModel[]>(() => state.items || []),
        currentWorkspace: computed<WorkspaceModel|undefined>(() => state.currentItem),
        currentWorkspaceId: computed<string|undefined>(() => state.currentItem?.workspace_id),
    });

    const actions = {
        async load(userId?: string) {
            if (!userId) {
                state.items = [];
                return;
            }
            const { results } = await SpaceConnector.clientV2.identity.userProfile.getWorkspaces<undefined, ListResponse<WorkspaceModel>>();
            state.items = results || [];
        },
        setCurrentWorkspace(workspaceId?: string) {
            const found = state.items.find((workspace) => workspace.workspace_id === workspaceId);
            let currentItem: WorkspaceModel|undefined;
            if (found) {
                currentItem = found;
            } else if (state.items.length) {
                currentItem = state.items[0];
            } else {
                currentItem = undefined;
            }

            state.currentItem = currentItem;
        },
    };

    return {
        getters,
        ...actions,
    };
});
