import type { Query } from '@cloudforet/core-lib/space-connector/type';

export interface CloudServiceListParameters {
    query?: Query;
    cloud_service_id?: string;
    name?: string;
    state?: string;
    ip_addresses?: string[];
    account?: string;
    instance_type?: string;
    cloud_service_type?: string;
    cloud_service_group?: string;
    provider?: string;
    region_code?: string;
    project_id?: string;
    project_group_id?: string;
    workspace_id?: string;
}
