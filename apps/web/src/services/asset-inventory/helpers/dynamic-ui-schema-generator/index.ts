import type { DynamicField } from '@spaceone/design-system/types/data-display/dynamic/dynamic-field/type/field-schema';
import type { DynamicLayout } from '@spaceone/design-system/types/data-display/dynamic/dynamic-layout/type/layout-schema';
import type { JsonSchema } from '@spaceone/design-system/types/inputs/forms/json-schema-form/type';

import { SpaceConnector } from '@cloudforet/core-lib/space-connector';

import type { ListResponse } from '@/schema/_common/api-verbs/list';
import type { UserConfigCreateParameters } from '@/schema/config/user-config/api-verbs/create';
import type { GetUserConfigParameters } from '@/schema/config/user-config/api-verbs/get';
import type { UpdateUserConfigParameters } from '@/schema/config/user-config/api-verbs/update';
import type { UserConfigModel } from '@/schema/config/user-config/model';
import type { SchemaListParameters } from '@/schema/identity/schema/api-verbs/list';
import type { SchemaModel } from '@/schema/identity/schema/model';

import ErrorHandler from '@/common/composables/error/errorHandler';

import { getDefaultDetailSchema, getDefaultSearchSchema, getDefaultTableSchema } from '@/services/asset-inventory/helpers/dynamic-ui-schema-generator/dynamic-layout-schema-template';
import type { GetSchemaParams, ResourceType } from '@/services/asset-inventory/helpers/dynamic-ui-schema-generator/type';

const getCustomTableSchemaKey = (userData:{userType:string, userId: string}, resourceType:ResourceType, provider:string) => {
    const { userType, userId } = userData;
    return `console:${userType}:${userId}:page-schema:${resourceType}?provider=${provider}:table`;
};

export const getCustomTableSchema = async (userData:{userType:string, userId: string}, resourceType:ResourceType, provider:string):Promise<DynamicLayout | undefined> => {
    let userConfig:UserConfigModel<DynamicLayout>|undefined;
    try {
        userConfig = await SpaceConnector.clientV2.config.userConfig.get<GetUserConfigParameters, UserConfigModel<DynamicLayout>>({
            name: getCustomTableSchemaKey(userData, resourceType, provider),
        });
    } catch (e) {
        ErrorHandler.handleError(e);
        return undefined;
    }
    return Object.keys(userConfig?.data ?? {}).length ? userConfig?.data : undefined;
};

export const updateCustomTableSchema = async (userData:{userType:string, userId: string}, resourceType:ResourceType, provider:string, data:any) => {
    const client = SpaceConnector.clientV2.config;
    const customSchemaData = await getCustomTableSchema(userData, resourceType, provider);
    try {
        if (customSchemaData) {
            await client.userConfig.update<UpdateUserConfigParameters, UserConfigModel>({
                name: getCustomTableSchemaKey(userData, resourceType, provider),
                data,
            });
        } else {
            await client.userConfig.create<UserConfigCreateParameters, UserConfigModel>({
                name: getCustomTableSchemaKey(userData, resourceType, provider),
                data,
            });
        }
    } catch (e) {
        ErrorHandler.handleError(e);
    }
};


const getAccountFields = (accountSchema) => Object.entries<JsonSchema>(accountSchema?.schema?.properties ?? {}).map(([key, value]) => ({
    key: `data.${key}`,
    name: value?.title ?? key,
    type: 'text',
}));

const getAccountSchema = async ({ options, resourceType }: Pick<GetSchemaParams, 'options'|'resourceType'>) => {
    const isTrustedAccount = resourceType === 'identity.TrustedAccount';
    try {
        const res = await SpaceConnector.clientV2.identity.schema.list<SchemaListParameters, ListResponse<SchemaModel>>({
            provider: options?.provider,
        });
        if (res?.results?.length) {
            return res.results.find((schema) => schema.schema_type === (isTrustedAccount ? 'TRUSTED_ACCOUNT' : 'SERVICE_ACCOUNT'));
        } return undefined;
    } catch (e) {
        ErrorHandler.handleError(e);
        return undefined;
    }
};

export const getServiceAccountTableSchema = async ({
    userData, resourceType, options,
}: GetSchemaParams) => {
    const isTrustedAccount = resourceType === 'identity.TrustedAccount';
    const accountSchema = await getAccountSchema({ options, resourceType });
    if (!accountSchema) {
        ErrorHandler.handleError(new Error('Service Account schema not found'));
        return undefined;
    }
    const fields:DynamicField[] = getAccountFields(accountSchema);
    let schemaData = getDefaultTableSchema(fields, isTrustedAccount);

    const customSchemaData = accountSchema?.provider ? await getCustomTableSchema(userData, resourceType, accountSchema?.provider) : undefined;
    if (customSchemaData) schemaData = customSchemaData;

    const searchSchemaData = getDefaultSearchSchema(fields, isTrustedAccount);
    if (schemaData.options) schemaData.options.search = searchSchemaData.search;

    return schemaData;
};

export const getDetailSchema = async ({ resourceType, options }: Pick<GetSchemaParams, 'resourceType'|'options' >): Promise<{ details: Partial<DynamicLayout>[] }> => {
    const isTrustedAccount = resourceType === 'identity.TrustedAccount';
    const accountSchema = await getAccountSchema({ options, resourceType });
    const fields:DynamicField[] = getAccountFields(accountSchema);
    return getDefaultDetailSchema(fields, isTrustedAccount);
};
