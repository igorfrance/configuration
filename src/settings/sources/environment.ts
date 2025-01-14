import { IValueSource } from "../value";

export class EnvironmentVariables implements IValueSource {

    private variables: Record<string, string> = {};

    constructor(variables: Record<string, string> = {}) {
        Object.assign(this.variables, variables);
    }

    public getValue(name: string): string | undefined {
        return this.variables[name];
    }
}
