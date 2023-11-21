import type { Tags, TimeStamp } from '@/api-schema/common/model';

export interface PolicyModel {
    created_at: TimeStamp;
    domain_id: string;
    name: string;
    permissions: Array<string>;
    policy_id: string;
    repository_info?: RepositoryInfoDataModel;
    tags: Tags;
    policy_type?: string;
    project_id?: string;
    labels?: any;
    state?: PolicyState;
    updated_at?: TimeStamp;
}

interface RepositoryInfoDataModel {
    repository_id: string;
    name: string;
    repository_type: string;
    endpoint: string;
}

export const POLICY_STATE = {
    ENABLED: 'ENABLED',
    DISABLED: 'DISABLED',
} as const;
export type PolicyState = typeof POLICY_STATE[keyof typeof POLICY_STATE];


// TODO: where
export const POLICY_TYPE = Object.freeze({
    MANAGED: 'MANAGED',
    CUSTOM: 'CUSTOM',
    ALL: 'ALL',
} as const);
export type PolicyType = typeof POLICY_TYPE[keyof typeof POLICY_TYPE];
