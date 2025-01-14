import { expect, describe, it, beforeEach } from "vitest";
import { DecoratorFactory, createDecoratorFactory, PropertyFactory } from "./decorators";
import { IValueSource, VarType } from "./value";

export class TestVariableSource implements IValueSource {

    private variables: Record<string, string> = {};

    constructor(variables: Record<string, string> = {}) {
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

describe("decorators", () => {

    function decoratorTest<T>(
        decorators: PropertyFactory, group: string, decoratorName: string,
        defaultValue: VarType, configValue: VarType, expected: T, propName = "TEST"
    ) {
        const decorator: DecoratorFactory = decorators[group][decoratorName];

        const varsource = decorators.source as TestVariableSource;
        varsource.setValue(propName, configValue as string);

        class X {
            @decorator({ name: propName, default: defaultValue })
            public value: T;
        }

        class Y {
            @decorator(propName)
            public value: VarType = defaultValue;
        }

        if (group === "list") {
            expect(new X().value).toMatchObject(expected as string[]);
            expect(new Y().value).toMatchObject(expected as string[]);
        }
        else {
            expect(new X().value).toBe(expected);
            expect(new Y().value).toBe(expected);
        }
        varsource.unsetValue(propName);
    }

    describe("env", () => {

        let env: PropertyFactory;

        beforeEach(() => {
            env = createDecoratorFactory(new TestVariableSource());
        });

        describe("@scalar.number", () => {
            it.each([
                [0, "10", 10],
                [0, "abc", 0],
                [5, "", 5],
                [5, undefined, 5],
                [0, "10.5", 10.5],
                [0, "-10", -10],
                [0, "1e3", 1000],
                [0, "Infinity", Infinity],
                [0, "-Infinity", -Infinity],
                [0, "abc", 0],
                [null, null, undefined],
                [undefined, "NaNDOS", undefined],
            ])("(default: %s) should resolve value (%s) to (%s)", (defaultValue, environmentValue, expected) => {
                decoratorTest<number>(env, "scalar", "number", defaultValue, environmentValue, expected);
            });
        });

        describe("@scalar.string", () => {
            it.each([
                ["default", "env", "env"],
                ["default", "", "default"],
                ["default", undefined, "default"],
                [undefined, "null", "null"],
                [undefined, null, undefined],
                [undefined, undefined, undefined],
            ])("(default: %s) should resolve value (%s) to (%s)", (defaultValue, environmentValue, expected) => {
                decoratorTest<string>(env, "scalar", "string", defaultValue, environmentValue, expected);
            });
        });

        describe("@scalar.boolean", () => {
            it.each([
                [false, "true", true],
                [false, "1", true],
                [true, "false", false],
                [false, "0", false],
                [false, "abc", false],
                [undefined, "abc", undefined],
            ])("(default: %s) should resolve value (%s) to (%s)", (defaultValue, environmentValue, expected) => {
                decoratorTest<boolean>(env, "scalar", "boolean", defaultValue, environmentValue, expected);
            });
        });

        describe("@list.string", () => {
            it.each([
                [["a", "b", "c"], "", ["a", "b", "c"]],
                [["a", "b", "c"], "1", ["1"]],
                [null, "1,2,3", ["1", "2", "3"]],
            ])("(default: %s) should resolve value (%s) to (%s)", (defaultValue, environmentValue, expected) => {
                decoratorTest<string[]>(env, "list", "string", defaultValue, environmentValue, expected);
            });
        });
    });

    describe("argv", () => {

        let argv: PropertyFactory;

        beforeEach(() => {
            argv = createDecoratorFactory(new TestVariableSource());
        });

        describe("@scalar.number", () => {
            it.each([
                [0, "10", 10],
                [0, "abc", 0],
                [5, "", 5],
                [5, undefined, 5],
                [0, "10.5", 10.5],
                [0, "-10", -10]
            ])("(default: %s) should resolve value (%s) to (%s)", (defaultValue, argValue, expected) => {
                decoratorTest<number>(argv, "scalar", "number", defaultValue, argValue, expected);
            });
        });

        describe("@scalar.string", () => {
            it.each([
                ["default", "arg", "arg"],
                ["default", "", "default"],
                ["default", undefined, "default"],
                [undefined, "value", "value"]
            ])("(default: %s) should resolve value (%s) to (%s)", (defaultValue, argValue, expected) => {
                decoratorTest<string>(argv, "scalar", "string", defaultValue, argValue, expected);
            });
        });

        describe("@scalar.boolean", () => {
            it.each([
                [false, "true", true],
                [false, "1", true],
                [true, "false", false],
                [false, "0", false]
            ])("(default: %s) should resolve value (%s) to (%s)", (defaultValue, argValue, expected) => {
                decoratorTest<boolean>(argv, "scalar", "boolean", defaultValue, argValue, expected);
            });
        });

        describe("@list.number", () => {
            it.each([
                [[1, 2, 3], "", [1, 2, 3]],
                [[1, 2, 3], "1", [1]],
                [null, "1,2,3", [1, 2, 3]]
            ])("(default: %s) should resolve value (%s) to (%s)", (defaultValue, argValue, expected) => {
                decoratorTest<number[]>(argv, "list", "number", defaultValue, argValue, expected);
            });
        });

        describe("@list.string", () => {
            it.each([
                [["a", "b"], "", ["a", "b"]],
                [["a", "b"], "x", ["x"]],
                [null, "x,y", ["x", "y"]]
            ])("(default: %s) should resolve value (%s) to (%s)", (defaultValue, argValue, expected) => {
                decoratorTest<string[]>(argv, "list", "string", defaultValue, argValue, expected);
            });
        });

        describe("@list.boolean", () => {
            it.each([
                [[true, false], "", [true, false]],
                [[true, false], "1", [true]],
                [null, "1,0", [true, false]]
            ])("(default: %s) should resolve value (%s) to (%s)", (defaultValue, argValue, expected) => {
                decoratorTest<boolean[]>(argv, "list", "boolean", defaultValue, argValue, expected);
            });
        });
    });
});
