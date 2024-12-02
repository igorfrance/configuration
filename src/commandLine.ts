import { IValueSource } from "./value";

export class CommandLineArguments implements IValueSource {

    argv: string[];
    arguments: string[];
    private variables: Record<string, string> = {};

    constructor(argv: string[] = []) {
        this.argv = [...argv];
        this.parseCommandLine(argv);
    }

    parseCommandLine(argv: string[] = []) {
        const args = [...argv];
        while (args.length) {
            let key = args.shift();
            let value = args[0];
            if (key.startsWith("--")) {
                key = key.slice(2);
            }
            else if (key.startsWith("-")) {
                key = key.slice(1);
            }
            else {
                value = key;
                key = null;
            }

            if (key) {
                this.variables[key] = value;
            }
            else {
                this.arguments.push(value);
            }
        }
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
