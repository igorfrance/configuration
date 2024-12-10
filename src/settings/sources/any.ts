import { IValueSource, Value } from "../value";

export class AnySource implements IValueSource {

    constructor(readonly sources: IValueSource[]) {
    }

    getValue(name: string): string {
        for (const source of this.sources) {
            const value = source.getValue(name);
            if (!Value.isUndefined(value)) {
                return value;
            }
        }

        return null;
    }
}
