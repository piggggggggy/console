import type { ProjectModel } from '@/api-clients/identity/project/schema/model';
import type { ProjectType } from '@/api-clients/identity/project/schema/type';

import { RESOURCE_CONFIG_MAP } from '../shared/contants/resource-config-map';
import { useReferenceModel } from './composable/use-reference-model';
import type { ReferenceItem, ReferenceMap } from './types/reference-type';
import { useProjectGroupReferenceModel } from './use-project-group-reference-model';


interface ProjectResourceItemData {
    groupInfo?: {
        id: string;
        name: string;
    };
    users: string[];
    projectType: ProjectType;
    workspaceId: string;
}
export type ProjectReferenceItem = Required<Pick<ReferenceItem<ProjectResourceItemData>, 'key'|'label'|'name'|'data'>>;
export type ProjectReferenceMap = ReferenceMap<ProjectReferenceItem>;

export const useProjectReferenceModel = () => {
    const { map: projectGroupMap } = useProjectGroupReferenceModel();
    const referenceConfig = {
        transform: (projectInfo: ProjectModel) => {
            const projectGroup = projectGroupMap.value?.[projectInfo.project_group_id];
            return {
                key: projectInfo.project_id,
                label: (projectGroup)
                    ? `${projectGroup.name} > ${projectInfo.name}` : projectInfo.name,
                name: projectInfo.name,
                data: {
                    groupInfo: (projectGroup) ? {
                        id: projectGroup.key,
                        name: projectGroup.name,
                    } : undefined,
                    users: projectInfo.users || [],
                    projectType: projectInfo.project_type,
                    workspaceId: projectInfo.workspace_id,
                },
            };
        },
        only: ['project_id', 'name', 'project_group_id', 'users', 'project_type', 'workspace_id'],
    };

    const { map } = useReferenceModel<ProjectModel, ProjectReferenceMap>(RESOURCE_CONFIG_MAP.project.resourceKey);

    return {
        map,
    };
};
