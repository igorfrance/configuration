/* eslint-disable @typescript-eslint/no-explicit-any */
const nullValues: (VarType)[] = [null, undefined];

const trueValues = [true, 1, "true", "1"];
const falseValues = [false, 0, "false", "0"];
const booleanValues = trueValues.concat(falseValues);

export type VarType = string | number | boolean | string[] | number[] | boolean[];

type ValueConverter<T extends VarType> = (value: VarType, defaultValue?: T) => T;

/**
 * Type check and conversion methods for supported concrete types.
 *
 * @template T - The specific variable type that extends VarType.
 */
export interface ITypeInfo<T extends VarType> {
    name: string;
    convert: ValueConverter<T>;
    isValid: (value: VarType) => boolean;
}

/**
 * The source objects from which configuration values are retrieved.
 */
export interface IValueSource {
    getValue(name: string | number): string | undefined;
}

/**
 * Utility class for handling and converting various types of values.
 * Provides methods for type checking and conversion of primitive types and arrays.
 */
export class Value {
    /**
     * Checks if the given value is undefined or null.
     * @param value - The value to check.
     * @returns `true` if the value is undefined or null, otherwise `false`.
     */
    static isUndefined(value: VarType): boolean {
        return nullValues.includes(value);
    }

    /**
     * Checks if the given string value is undefined, null, or empty.
     * @param value - The string value to check.
     * @returns `true` if the value is undefined, null, or empty, otherwise `false`.
     */
    static isUndefinedOrEmpty(value: string): boolean {
        return Value.isUndefined(value) || String(value).trim() === "";
    }

    /**
     * Checks if the given value is a boolean or can be converted to a boolean.
     * @param value - The value to check.
     * @returns `true` if the value is a boolean or can be converted to a boolean, otherwise `false`.
     */
    static isBoolean(value: VarType): boolean {
        return !Value.isUndefined(value) && booleanValues.includes(value as (boolean | string));
    }

    /**
     * Converts the given value to a string.
     * @param value - The value to convert.
     * @param defaultValue - The default value to return if the value is undefined or empty.
     * @returns The converted string value or the default value.
     */
    static getString(value: VarType, defaultValue?: string): string {
        return Value.isUndefinedOrEmpty(value as string) ? defaultValue as string : String(value);
    }

    /**
     * Converts a given value to a boolean. If the value is strictly `true` or `false`,
     * it returns the value as is. If the value is a string that matches any of the
     * predefined true or false values, it returns the corresponding boolean.
     * Otherwise, it returns the provided default value or `false` if no default is provided.
     *
     * @param value - The value to be converted to a boolean.
     * @param defaultValue - An optional boolean value to return if the conversion is not possible.
     * @returns The boolean representation of the value or the default value.
     */
    static getBoolean(value: VarType, defaultValue?: boolean): boolean {
        if (value === true || value === false) {
            return value;
        }

        if (trueValues.includes(String(value).toLowerCase())) {
            return true;
        }
        if (falseValues.includes(String(value).toLowerCase())) {
            return false;
        }

        return (defaultValue) as boolean;
    }

    /**
     * Converts a given value to a number. If the conversion fails, returns the provided default value.
     *
     * @param value - The value to be converted to a number.
     * @param defaultValue - The default number to return if the conversion fails.
     * @returns The converted number, or the default value if the conversion fails.
     */
    static getNumber(value: VarType, defaultValue?: number): number {
        const num = parseFloat(String(value));
        return isNaN(num) ? defaultValue : num;
    }

    /**
     * Converts a given value to an array of a specified type using a provided converter function.
     * If the value is undefined or empty, returns a default value or an empty array.
     *
     * @template T - The type of the array elements.
     * @param {VarType} value - The value to be converted to an array.
     * @param {ValueConverter<VarType>} converter - The function used to convert each element of the array.
     * @param {T} [defaultValue] - The default value to return if the input value is undefined or empty.
     * @returns {T} - The converted array or the default value.
     */
    static getArray<T extends VarType>(
        value: VarType, converter: ValueConverter<VarType>, defaultValue?: T
    ): T {

        if (Value.isUndefinedOrEmpty(String(value))) {
            return (defaultValue || []) as T;
        }

        const result = String(value).split(/\s*,\s*/).map(converter) as (string[] | number[] | boolean[]);
        if (result.some((r: any) => Value.isUndefinedOrEmpty(String(r)))) {
            return (defaultValue || []) as T;
        }

        return result as T;
    }
}
