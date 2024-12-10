import { IValueSource } from "../value";

export class CommandLineArguments implements IValueSource {

    positional: string[] = [];

    private variables: Record<string, string> = {};
    private argv: string[] = [];

    constructor(argv: string[] = []) {
        this.argv = [...argv];
        this.parseCommandLine(this.argv);
    }

    parseCommandLine(argv: string[] = []) {
        const args = [...argv];
        while (args.length) {

            const arg = args.shift();
            if (!arg.startsWith("-")) {
                this.positional.push(arg);
                continue;
            }

            let value: string;
            if (!args[0] || args[0].startsWith("-")) {
                value = null;
            }
            else {
                value = args.shift();
            }

            this.variables[arg] = value;
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
