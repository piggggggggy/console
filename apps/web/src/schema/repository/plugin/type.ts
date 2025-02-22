import type { PLUGIN_STATE, REGISTRY_TYPE } from '@/schema/repository/plugin/constant';

import type { MonitoringType } from '@/common/modules/monitoring/config';

export type PluginState = typeof PLUGIN_STATE[keyof typeof PLUGIN_STATE];

export type RegistryType = typeof REGISTRY_TYPE[keyof typeof REGISTRY_TYPE];

export interface Capability {
    supported_schemas: string[];
    use_resource_secret: boolean;
    monitoring_type: MonitoringType;
    supported_providers?: string[];

    [key: string]: any;
}
