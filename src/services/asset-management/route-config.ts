export const ASSET_MANAGEMENT_ROUTE = Object.freeze({
    _NAME: 'inventory',
    SERVER: { _NAME: 'server' },
    CLOUD_SERVICE: {
        _NAME: 'cloudService',
        TYPE: { _NAME: 'cloudServiceMain' },
        SEARCH: { _NAME: 'cloudServiceSearch' },
        TYPE_SEARCH: { _NAME: 'cloudServiceTypeSearch' },
        NO_RESOURCE: { _NAME: 'noCloudService' },
        DETAIL: { _NAME: 'cloudServiceDetail' },
    },
    COLLECTOR: {
        _NAME: 'collectorMain',
        CREATE: {
            _NAME: 'createCollector',
            PLUGINS: { _NAME: 'collectorPlugins' },
            STEPS: { _NAME: 'collectorCreateSteps' },
        },
    },
    SERVICE_ACCOUNT: {
        _NAME: 'serviceAccount',
        SEARCH: { _NAME: 'serviceAccountSearch' },
        ADD: { _NAME: 'addServiceAccount' },
        NO_RESOURCE: { _NAME: 'noServiceAccount' },
    },
    HISTORY: {
        _NAME: 'history',
        COLLECTOR: {
            _NAME: 'collectorHistory',
            JOB: { _NAME: 'collectorJobHistory' },
        },
    },
});
