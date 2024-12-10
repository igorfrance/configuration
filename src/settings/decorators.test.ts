import { expect, describe, it } from "vitest";
import { DecoratorFactory, config, argv, PropertyFactory } from "./decorators";
import { IValueSource, VarType } from "./value";

type TestableVariableSource = IValueSource & {
    setValue(name: string, value: string): void;
    unsetValue(name: string): void;
};

describe("decorators", () => {

    function decoratorTest<T>(
        decorators: PropertyFactory, group: string, decoratorName: string,
        defaultValue: VarType, environmentValue: VarType, expected: T, propName = "TEST"
    ) {
        const decorator: DecoratorFactory = decorators[group][decoratorName];

        class X {
            @decorator({ name: propName, default: defaultValue })
            public value: T;
        }

        class Y {
            @decorator(propName)
            public value: VarType = defaultValue;
        }

        const source = decorators.source as TestableVariableSource;
        source.setValue(propName, environmentValue as string);

        if (group === "list") {
            expect(new X().value).toMatchObject(expected as string[]);
            expect(new Y().value).toMatchObject(expected as string[]);
        }
        else {
            expect(new X().value).toBe(expected);
            expect(new Y().value).toBe(expected);
        }
        source.unsetValue(propName);
    }

    describe("env", () => {

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
                decoratorTest<number>(config, "scalar", "number", defaultValue, environmentValue, expected);
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
                decoratorTest<string>(config, "scalar", "string", defaultValue, environmentValue, expected);
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
                decoratorTest<boolean>(config, "scalar", "boolean", defaultValue, environmentValue, expected);
            });
        });

        describe("@list.string", () => {
            it.each([
                [["a", "b", "c"], "", ["a", "b", "c"]],
                [["a", "b", "c"], "1", ["1"]],
                [null, "1,2,3", ["1", "2", "3"]],
            ])("(default: %s) should resolve value (%s) to (%s)", (defaultValue, environmentValue, expected) => {
                decoratorTest<string[]>(config, "list", "string", defaultValue, environmentValue, expected);
            });
        });
    });

    describe("argv", () => {
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
