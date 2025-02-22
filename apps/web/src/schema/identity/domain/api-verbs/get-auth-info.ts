

export interface DomainGetAuthInfoParams {
    name: string;
}

export interface DomainGetAuthInfoResponse {
    domain_id: string;
    name: string;
    external_auth_state: 'ENABLED' | 'DISABLED';
    metadata: Metadata;
    config: Record<string, any>;
}

interface Metadata {
    plugin_info: object;
    auth_type: string;
}
