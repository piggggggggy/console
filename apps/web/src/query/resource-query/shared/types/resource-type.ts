import type { ListResponse } from '@/api-clients/_common/schema/api-verbs/list';
import type { RESOURCE_CONFIG_MAP } from '@/query/resource-query/shared/contants/resource-config-map';

export type ResourceKeyType = keyof typeof RESOURCE_CONFIG_MAP;
// 'cloud_service_type'
// |'cloud_service_query_set'
// |'collector'
// |'cost_data_source'
// |'plugin'
// |'project_group'
// |'project'
// |'protocol'
// |'provider'
// |'public_dashboard'
// |'public_folder'
// |'region'
// |'secret'
// |'service_account'
// |'trusted_account'
// |'user'
// |'user_group'
// |'webhook'
// |'workspace'
// |'escalation_policy'
// |'metric'
// |'namespace'
// |'workspace_group'
// |'role'
// |'service'
// |'app';

export interface ReferenceFetchInfo<T> {
    listFetchFn: (params: any) => Promise<ListResponse<T>>;
    statFetchFn?: (params: any) => Promise<ListResponse<any>>;
    only?: string[];
    searchTargets?: string[];
    nameFormatter?: (...args: any) => string;
}

export interface ReferenceConfig {
    name: string;
    resourceKey: ResourceKeyType;
    idKey: string;
    nameKey: string;
}
