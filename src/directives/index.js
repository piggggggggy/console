import focus from './module/focus';

// eslint-disable-next-line @typescript-eslint/naming-convention,func-names
export default function (app) {
    // Register global custom directive
    app.directive('focus', focus);
}
