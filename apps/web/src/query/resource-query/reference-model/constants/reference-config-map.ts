import type { ProjectGroupModel } from '@/api-clients/identity/project-group/schema/model';
import type { ProjectModel } from '@/api-clients/identity/project/schema/model';
import type { ProviderModel } from '@/api-clients/identity/provider/schema/model';
import type { MetricModel } from '@/schema/inventory/metric/model';
import type { NamespaceModel } from '@/schema/inventory/namespace/model';

import { assetUrlConverter } from '@/lib/helper/asset-helper';

import { indigo } from '@/styles/colors';

export const REFERENCE_CONFIG_MAP: Record<string, any> = {
    project: {
        transform: (projectInfo: ProjectModel) => ({
            key: projectInfo.project_id,
            // label: (projectGroup)
            //     ? `${projectGroup.name} > ${projectInfo.name}` : projectInfo.name,
            name: projectInfo.name,
            data: {
                // groupInfo: (projectGroup) ? {
                //     id: projectGroup.key,
                //     name: projectGroup.name,
                // } : undefined,
                users: projectInfo.users || [],
                projectType: projectInfo.project_type,
                workspaceId: projectInfo.workspace_id,
            },
        }),
        only: ['project_id', 'name', 'project_group_id', 'users', 'project_type', 'workspace_id'],
    },
    projectGroup: {
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
    },
    metric: {
        transform: (metricInfo: MetricModel) => ({
            key: metricInfo.metric_id,
            label: metricInfo.name,
            name: metricInfo.name,
            data: {
                namespace_id: metricInfo.namespace_id,
                is_managed: metricInfo.is_managed,
                resource_type: metricInfo.resource_type,
                resource_group: metricInfo.resource_group,
                unit: metricInfo.unit,
                labels_info: metricInfo.labels_info,
            },
        }),
        only: [],
    },
    namespace: {
        transform: (namespaceInfo: NamespaceModel) => ({
            key: namespaceInfo.namespace_id,
            label: namespaceInfo.name,
            name: namespaceInfo.name,
            data: {
                category: namespaceInfo.category,
                icon: namespaceInfo.icon,
                group: namespaceInfo.group,
                resource_type: namespaceInfo.resource_type,
            },
        }),
        only: [],
    },
    provider: {
        transform: (providerInfo: ProviderModel) => ({
            key: providerInfo.provider,
            label: providerInfo.alias || providerInfo.name,
            name: providerInfo.name,
            icon: assetUrlConverter(providerInfo.icon),
            color: providerInfo.color || indigo[400],
            data: providerInfo,
        }),
        only: [],
    },
} as const;
