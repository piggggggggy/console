
import type { RESOURCE_CONFIG_MAP } from '../../shared/contants/resource-config-map';

export type ReferenceKeyType = keyof typeof RESOURCE_CONFIG_MAP;
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


export interface ReferenceItem<Data = Record<string, any>> {
    key?: string;
    label?: string;
    name?: string;
    color?: string;
    icon?: string;
    provider?: string;
    continent?: {
        continent_code?: string;
        continent_label?: string;
        latitude?: number;
        longitude?: number;
    };
    latitude?: string;
    longitude?: string;
    data?: Data;
    description?: string;
    link?: string;
}

export type ReferenceMap<Item extends ReferenceItem = ReferenceItem> = Record<string, Item>;

// export interface ReferenceState<Items = Record<string, any>> {
//     items: Items;
// }

// export interface ReferenceRootState {
//     isAllLoaded: boolean;
// }

// export interface ReferenceLoadOptions {
//     lazyLoad?: boolean;
//     force?: boolean;
// }

// export interface ReferenceTypeInfo {
//     type: string; // 'project'
//     key: string; // project_id
//     name: string; // Project
//     referenceMap: ReferenceMap;
// }
