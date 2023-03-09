export class Gtm {
    private static _gtm: null|Gtm = null;

    constructor() {}

    static init() {
        try {
            Gtm._gtm = new Gtm();
        } catch (e) {
            console.error(e);
            Gtm._gtm = null;
        }
    }

    static get gtm(): null|Gtm {
        return Gtm._gtm;
    }
}
