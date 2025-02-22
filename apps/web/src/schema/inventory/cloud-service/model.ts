import type { CloudServiceState } from '@/schema/inventory/cloud-service/type';

export interface CloudServiceModel {
    cloud_service_id:string;
    name:string;
    state: CloudServiceState;
    ip_addresses: string[];
    account: string;
    instance_type: string;
    instance_size: number;
    cloud_service_type: string;
    cloud_service_group: string;
    provider: string;
    data: {[key:string]: any};
    metadata: {[key:string]: any};
    reference: {[key:string]: any};
    tags: {[key:string]: any};
    tag_keys: string[];
    collection_info: string[];
    region_code: string;
    project_id: string;
    workspace_id: string;
    domain_id: string;
    created_at: string;
    updated_at: string;
    deleted_at: string;
}
