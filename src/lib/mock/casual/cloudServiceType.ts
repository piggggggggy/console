/* eslint-disable camelcase */
import { arrayOf } from '@/lib/casual';
// eslint-disable-next-line import/no-cycle
import { modelType } from '@/lib/mock/casual/index';
import {
    CollectionInfo, DefaultMetaData, ReferenceInfo, TimeStamp,
} from '@/lib/fluent-api';


const cloudServiceType = (casual) => {
    casual.define('cloudServiceType', () => ({
        cloud_service_type_id: casual.make_id('cst'),
        provider: casual.random_element(['aws', 'google_cloud', 'azure']),
        group: casual.word,
        name: casual.word,

        data_source: [
            { name: 'Name', key: 'data.name' },
            { name: 'State', key: 'data.state' },
            { name: 'Created At', key: 'created_at' },
        ],
        labels: arrayOf(casual.integer(1, 3), casual._word),
        cloud_service_count: casual.integer(1, 10),

        domain_id: casual.make_id('domain'),
        tags: casual.tags,
        collection_info: casual.collectInfo,
        created_at: casual.timestamp,
        updated_at: casual.timestamp,
        deleted_at: casual.timestamp,
    }));
    return casual;
};

const cloudService = (casual) => {
    casual.define('cloudService', () => ({
        provider: casual.random_element(['aws', 'google_cloud', 'azure']),
        cloud_service_type: casual.word,
        cloud_service_group: casual.word,
        data: casual.resourceData,
        // metadata: DefaultMetaData;
        reference: casual.reference,
        project_id: casual.make_id('project'),
        cloud_service_type_id: casual.make_id('cs'),
        name: casual.word,

        // data_source: DataSourceItem[],
        labels: casual.labels,
        cloud_service_count: casual.integer(1, 10),

        domain_id: casual.make_id('domain'),
        tags: casual.tags,
        collection_info: casual.collectInfo,
        created_at: casual.timestamp,
        updated_at: casual.timestamp,
        deleted_at: casual.timestamp,
    }));
    return casual;
};

const result: modelType[] = [
    cloudServiceType, cloudService,
];
export interface CloudServiceTypeCasual{
    cloudService?: any;
    _cloudService?: any;
    cloudServiceType?: any;
    _cloudServiceType?: any;
}
export default result;
