import { expect, describe, it } from "vitest";
import { DecoratorFactory, env, PropertyFactory } from "./decorators";
import { IValueSource, VarType } from "./value";

type TestableVariableSource = IValueSource & {
    setValue(name: string, value: string): void;
    unsetValue(name: string): void;
};

describe("decorators", () => {

    function decoratorTest<T>(
        decorators: PropertyFactory, group: string, name: string,
        defaultValue: VarType, environmentValue: VarType, expected: T
    ) {
        const decorator: DecoratorFactory = decorators[group][name];

        class X {
            @decorator({ name: "TEST", default: defaultValue })
            public value: T;
        }

        class Y {
            @decorator("TEST")
            public value: VarType = defaultValue;
        }

        const source = decorators.source as TestableVariableSource;
        source.setValue("TEST", environmentValue as string);

        if (group === "list") {
            expect(new X().value).toMatchObject(expected as string[]);
            expect(new Y().value).toMatchObject(expected as string[]);
        }
        else {
            expect(new X().value).toBe(expected);
            expect(new Y().value).toBe(expected);
        }
        source.unsetValue("TEST");
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

        describe("@list.number", () => {
            it.each([
                [[1, 2, 3], "", [1, 2, 3]],
                [[1, 2, 3], "1", [1]],
                [null, "1,2,3", [1, 2, 3]],
            ])("(default: %s) should resolve value (%s) to (%s)", (defaultValue, environmentValue, expected) => {
                decoratorTest<number[]>(env, "list", "number", defaultValue, environmentValue, expected);
            });
        });

        describe("@list.boolean", () => {
            it.each([
                [[true, false, true], "", [true, false, true]],
                [[true, false, true], "1", [true]],
                [null, "1,0,1", [true, false, true]],
            ])("(default: %s) should resolve value (%s) to (%s)", (defaultValue, environmentValue, expected) => {
                decoratorTest<boolean[]>(env, "list", "boolean", defaultValue, environmentValue, expected);
            });
        });
    });
});
