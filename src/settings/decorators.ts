import "dotenv/config";
import { CommandLineArguments } from "./sources/commandLine";
import { EnvironmentVariables } from "./sources/environment";
import { AnySource } from "./sources/any";
import { IPropertyDescriptor, Settings } from "./settings";
import { ITypeInfo, IValueSource, VarType, Value } from "./value";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Decorator = (target: any, fieldName: string) => void;

export type DecoratorFactory = (specs: string | number | IPropertyDescriptor<VarType>) => Decorator;

type DecoratorFactoryTypes = {
    number: DecoratorFactory;
    string: DecoratorFactory;
    boolean: DecoratorFactory;
};

type DecoratorFactoryGroup = DecoratorFactory & DecoratorFactoryTypes

export type PropertyFactory = DecoratorFactoryGroup & {
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
        convert: (value: VarType, defaultValue: string[]) =>
            Value.getArray(value, Value.getString, defaultValue),
        isValid: (value: VarType) =>
            Value.getArray(value, Value.getString) !== undefined
    } as ITypeInfo<string[]>,

    "number[]": {
        name: "number[]",
        convert: (value: VarType, defaultValue: number[]) =>
            Value.getArray(value, Value.getNumber, defaultValue),
        isValid: (value: VarType) =>
            Value.getArray(value, Value.getNumber) !== undefined
    } as ITypeInfo<number[]>,

    "boolean[]": {
        name: "boolean[]",
        convert: (value: VarType, defaultValue: boolean[]) =>
            Value.getArray(value, Value.getBoolean, defaultValue),
        isValid: (value: VarType) =>
            Value.getArray(value, Value.getBoolean) !== undefined
    } as ITypeInfo<boolean[]>
};

function createFieldDecorator<T extends VarType>(settings: IPropertyDescriptor<T>) {

    return function (target: any, fieldName: string) {
        Settings.createConfigurationProperty(target, fieldName, settings);
    };
}

function createDecoratorFactoryForType<T extends VarType>(type: ITypeInfo<T>, source: IValueSource): DecoratorFactory {

    return function (specs: string | number | IPropertyDescriptor<T>) {
        const parameterSpecs: IPropertyDescriptor<T> = Object.assign({}, specs, { type, source });
        if (typeof specs === "string") {
            parameterSpecs.name = specs;
            parameterSpecs.type = type;
            parameterSpecs.optional = true;
            parameterSpecs.source = source;
        }
        else if (typeof specs === "number") {
            parameterSpecs.index = specs;
            parameterSpecs.type = type;
            parameterSpecs.optional = true;
            parameterSpecs.source = source;
        }

        return createFieldDecorator(parameterSpecs);
    };
}

export function createDecoratorFactory(source: IValueSource): PropertyFactory {

    const scalarGroup = createDecoratorFactoryForType<string>(typeInfo.string, source) as
        unknown as DecoratorFactoryGroup;

    const listGroup = createDecoratorFactoryForType<string[]>(typeInfo["string[]"], source) as
        unknown as DecoratorFactoryGroup;

    scalarGroup.number = createDecoratorFactoryForType<number>(typeInfo.number, source);
    scalarGroup.string = createDecoratorFactoryForType<string>(typeInfo.string, source);
    scalarGroup.boolean = createDecoratorFactoryForType<boolean>(typeInfo.boolean, source);

    listGroup.number = createDecoratorFactoryForType<number[]>(typeInfo["number[]"], source);
    listGroup.string = createDecoratorFactoryForType<string[]>(typeInfo["string[]"], source);
    listGroup.boolean = createDecoratorFactoryForType<boolean[]>(typeInfo["boolean[]"], source);

    const propertyFactory = scalarGroup as unknown as PropertyFactory;
    propertyFactory.scalar = scalarGroup;
    propertyFactory.list = listGroup;
    propertyFactory.source = source;

    return propertyFactory;
}

export const env = createDecoratorFactory(new EnvironmentVariables(process.env));
export const argv = createDecoratorFactory(new CommandLineArguments(process.argv.slice(2)));

const any = new AnySource([env.source, argv.source]);
export const config = createDecoratorFactory(any);
