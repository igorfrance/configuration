import { IValueSource } from "../value";

/**
 * Class representing command line arguments and their values.
 */
export class CommandLineArguments implements IValueSource {

    /**
     * Array of positional arguments.
     */
    positional: string[] = [];

    private variables: Record<string, string> = {};
    private argv: string[] = [];

    /**
     * Creates an instance of CommandLineArguments.
     * @param argv - Array of command line arguments.
     */
    constructor(argv: string[] = []) {
        this.argv = [...argv];
        this.parseCommandLine(this.argv);
    }

    /**
     * Parses the command line arguments and populates the positional and variables properties.
     * @param argv - Array of command line arguments.
     */
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

    /**
     * Gets the value of a command line argument by name.
     * @param name - The name of the argument.
     * @returns The value of the argument, or undefined if not found.
     */
    public getValue(name: string | number): string | undefined {
        if (typeof name === "number") {
            return this.positional[name];
        }

        return this.variables[name];
    }
}
