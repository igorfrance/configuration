import { CommandLineArguments } from "./commandLine";
import { EnvironmentVariables } from "./environment";
import { IPropertyDescriptor, Settings } from "./settings";
import { ITypeInfo, IValueSource, VarType, Value } from "./value";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Decorator = (target: any, fieldName: string) => void;
export type DecoratorFactory = (specs: string | IPropertyDescriptor<VarType>) => Decorator;
type DecoratorFactoryTypes = {
    number: DecoratorFactory;
    string: DecoratorFactory;
    boolean: DecoratorFactory;
};
type DecoratorFactoryGroup = DecoratorFactory & DecoratorFactoryTypes
export type PropertyFactory = {
    scalar: DecoratorFactoryGroup,
    list: DecoratorFactoryGroup,
    source: IValueSource
};

const typeInfo = {
    string: {
        name: "string",
        convert: Value.getString,
        isValid: (value: VarType) => !Value.isUndefinedOrEmpty(value as string)
    } as ITypeInfo<string>,
    number: {
        name: "number",
        convert: Value.getNumber,
        isValid: (value: VarType) => !isNaN(parseFloat(String(value)))
    } as ITypeInfo<number>,
    boolean: {
        name: "boolean",
        convert: Value.getBoolean,
        isValid: (value: VarType) => Value.isBoolean(value)
    } as ITypeInfo<boolean>,
    "string[]": {
        name: "string[]",
        convert: (value: VarType, defaultValue: string[]) => Value.getArray(value, Value.getString, defaultValue),
        isValid: (value: VarType) => Value.getArray(value, Value.getString) !== undefined
    } as ITypeInfo<string[]>,
    "number[]": {
        name: "number[]",
        convert: (value: VarType, defaultValue: number[]) => Value.getArray(value, Value.getNumber, defaultValue),
        isValid: (value: VarType) => Value.getArray(value, Value.getNumber) !== undefined
    } as ITypeInfo<number[]>,
    "boolean[]": {
        name: "boolean[]",
        convert: (value: VarType, defaultValue: boolean[]) => Value.getArray(value, Value.getBoolean, defaultValue),
        isValid: (value: VarType) => Value.getArray(value, Value.getBoolean) !== undefined
    } as ITypeInfo<boolean[]>
};

function createFieldDecorator<T extends VarType>(settings: IPropertyDescriptor<T>) {

    return function (target: any, fieldName: string) {
        Settings.createConfigurationProperty(target, fieldName, settings);
    };
}

function createDecoratorFactoryForType<T extends VarType>(type: ITypeInfo<T>, source: IValueSource): DecoratorFactory {

    return function (specs: string | IPropertyDescriptor<T>) {
        const parameterSpecs: IPropertyDescriptor<T> = Object.assign({}, specs, { type, source });
        if (typeof specs === "string") {
            parameterSpecs.name = specs;
            parameterSpecs.type = type;
            parameterSpecs.optional = true;
            parameterSpecs.source = source;
        }

        return createFieldDecorator(parameterSpecs);
    };
}

function createDecoratorFactory(source: IValueSource): PropertyFactory {

    const result = {
        source,
        scalar: createDecoratorFactoryForType<string>(typeInfo.string, source) as unknown as DecoratorFactoryGroup,
        list: createDecoratorFactoryForType<string[]>(typeInfo["string[]"], source) as unknown as DecoratorFactoryGroup,
    } as PropertyFactory;

    result.scalar.number = createDecoratorFactoryForType<number>(typeInfo.number, source);
    result.scalar.string = createDecoratorFactoryForType<string>(typeInfo.string, source);
    result.scalar.boolean = createDecoratorFactoryForType<boolean>(typeInfo.boolean, source);

    result.list.number = createDecoratorFactoryForType<number[]>(typeInfo["number[]"], source);
    result.list.string = createDecoratorFactoryForType<string[]>(typeInfo["string[]"], source);
    result.list.boolean = createDecoratorFactoryForType<boolean[]>(typeInfo["boolean[]"], source);

    return result;
}

export const env = createDecoratorFactory(new EnvironmentVariables());
export const argv = createDecoratorFactory(new CommandLineArguments());
