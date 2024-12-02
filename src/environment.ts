import "dotenv/config";
import { IValueSource } from "./value";


export class EnvironmentVariables implements IValueSource {

    private variables: Record<string, string> = {};

    constructor(variables: Record<string, string> = process.env) {
        Object.assign(this.variables, variables);
    }

    public getValue(name: string): string | undefined {
        return this.variables[name];
    }

    public setValue(name: string, value: string) {
        this.variables[name] = value;
    }

    public unsetValue(name: string) {
        delete this.variables[name];
    }
}
