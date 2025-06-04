import type { ProjectGroupModel } from '@/api-clients/identity/project-group/schema/model';

import { RESOURCE_CONFIG_MAP } from '../shared/contants/resource-config-map';
import { useReferenceModel } from './composable/use-reference-model';
import type { ReferenceItem, ReferenceMap } from './types/reference-type';

interface ProjectGroupResourceItemData {
    parentGroupInfo?: {
        id: string;
        name: string;
    };
    users?: string[];
}
export type ProjectGroupReferenceItem = Required<Pick<ReferenceItem<ProjectGroupResourceItemData>, 'key'|'label'|'name'|'data'>>;
export type ProjectGroupReferenceMap = ReferenceMap<ProjectGroupReferenceItem>;

export const useProjectGroupReferenceModel = () => {
    const referenceConfig = {
        transform: (projectGroupInfo: ProjectGroupModel) => ({
            key: projectGroupInfo.project_group_id,
            // label: (parentGroup)
            //     ? `${parentGroup.name} > ${projectGroupInfo.name}` : projectGroupInfo.name,
            name: projectGroupInfo.name,
            data: {
            // parentGroupInfo: parentGroup ? {
            //     id: parentGroup.project_group_id,
            //     name: parentGroup.name,
            // } : undefined,
                users: projectGroupInfo.users,
            },
        }),
        only: [],
    };



    const { map } = useReferenceModel<ProjectGroupModel, ProjectGroupReferenceMap>(RESOURCE_CONFIG_MAP.projectGroup.resourceKey);

    return {
        map,
    };
};
