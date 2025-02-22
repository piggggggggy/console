import { REFERENCE_TYPE_INFO } from '@/lib/reference/reference-config';

export const ASSET_VARIABLE_TYPE_INFO = {
    asset_account: {
        type: 'asset_account',
        key: 'account',
        name: 'AWS Account ID (Asset)',
    },
    // asset_requirement_id: {
    //     type: 'asset_requirement_id',
    //     key: 'data.requirement_id',
    //     name: 'Requirement ID',
    // },
    asset_service: {
        type: 'asset_service',
        key: 'additional_info.service',
        name: 'Service',
    },
    cloud_service_query_set: {
        ...REFERENCE_TYPE_INFO.cloud_service_query_set,
        name: 'Compliance Framework',
    },
} as const;
