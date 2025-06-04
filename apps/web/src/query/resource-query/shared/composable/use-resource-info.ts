import { useProjectApi } from '@/api-clients/identity/project/composables/use-project-api';

import { RESOURCE_CONFIG_MAP } from '../contants/resource-config-map';

const resourceApiMap: Record<string, any> = {
    project: useProjectApi,
};

export const useResourceInfo = (resource: string) => {
    const referenceConfig = RESOURCE_CONFIG_MAP[resource];

    return {
        config: referenceConfig,
        api: resourceApiMap[resource],
    };
};
