/* eslint-disable @typescript-eslint/no-explicit-any */
import "reflect-metadata";
import { ITypeInfo, IValueSource, Value, VarType } from "./value";

/**
 * Describes the properties of a configuration parameter.
 * @template T - The type of the configuration value.
 */
export interface IPropertyDescriptor<T extends VarType> {
    name?: string;
    alias?: string;
    type?: ITypeInfo<T>;
    default?: T;
    optional?: boolean;
    secret?: boolean;
    doc?: string;
    source?: IValueSource;
}

type VarTypeAny = VarType | any;
type VariableInfo = IPropertyDescriptor<VarTypeAny> & { value: VarTypeAny };

type SettingsComposite = {
    [key: string]: Settings | VarType;
}

/**
 * Abstract base class for managing configuration settings with support for type validation,
 * nested settings, and environment variables.
 *
 * Settings provides a framework for:
 * - Automatic variable extraction and configuration property assignment
 * - Type validation and conversion of configuration values
 * - Nested settings hierarchy management
 * - Variable validation and verification
 * - Configuration serialization
 *
 * @example
 * ```typescript
 * class MySettings extends Settings {
 *   @ConfigVar({ type: Types.string })
 *   myVariable: string;
 * }
 *
 * const settings = new MySettings();
 * const validation = settings.verify();
 * console.log(settings.stringify());
 * ```
 *
 * @remarks
 * - Settings instances automatically initialize their configuration properties on construction
 * - Properties can be marked as optional or secret
 * - Supports recursive traversal of nested settings
 * - Provides validation for required variables
 *
 * @see {@link ConfigVar} for property decoration
 * @see {@link Types} for supported variable types
 */
export abstract class Settings {

    /**
     * Initializes a new instance of the Settings class.
     * Extracts stored variables from the instance and assigns configuration properties accordingly.
     */
    constructor() {
        Settings.assignConfigurationProperties(this);
    }

    getVariables(recursive?: boolean): Record<string, VariableInfo> {
        const result: Record<string, VariableInfo> = {};
        const envvars: Record<string, IPropertyDescriptor<VarTypeAny>> = Settings.extractStoredVariables(this);
        const self = this as unknown as SettingsComposite;
        for (const [fieldName, fieldSettings] of Object.entries(envvars)) {
            result[fieldName] = { ...fieldSettings, value: self[fieldName] };
        }

        if (recursive) {
            const settings = this.getSettings(false);
            for (const s in settings) {
                Object.assign(result, settings[s].getVariables(true));
            }
        }

        return result;
    }

    /**
     * Gets a dictionary of all properties of current instance and optionally nested properties
     * that derive from Settings.
     *
     * @param recursive - `true` to include nested properties that derive from Settings.
     * @param visited - An array of `Settings` instances that have already been visited.
     * @returns A record containing the settings.
     */
    getSettings(recursive?: boolean, visited: Settings[] = []): Record<string, Settings> {
        const result: Record<string, Settings> = {};
        for (const fieldName in this) {
            const prop = this[fieldName] as Settings;
            if (visited.includes(prop)) {
                continue;
            }

            if (prop instanceof Settings) {
                result[fieldName] = prop;
                visited.push(prop);
                if (recursive) {
                    Object.assign(result, prop.getSettings(true, visited));
                }
            }
        }

        return result;
    }

    /**
     * Retrieves a record of invalid variables and their associated settings.
     * A variable is considered invalid if it is non-optional and fails its type validation.
     *
     * @param recursive - If true, also checks for invalid variables in nested settings objects
     * @returns A Record where keys are field names and values are VariableInfo objects for invalid variables
     *
     * @example
     * ```typescript
     * const settings = new Settings();
     * const invalidVars = settings.getInvalidVariables(true);
     * // Returns: { fieldName: { type: TypeValidator, optional: boolean, ... } }
     * ```
     */
    getInvalidVariables(recursive?: boolean) {
        const invalid: Record<string, VariableInfo> = {};
        const self = this as unknown as SettingsComposite;
        const envvars = this.getVariables(false);

        for (const [fieldName, settings] of Object.entries(envvars)) {
            const { type, optional } = settings;
            if (!optional && !type.isValid(self[fieldName] as VarType)) {
                invalid[fieldName] = settings;
            }

            if (recursive) {
                const nestedSettings = this.getSettings(true);
                for (const fieldName in nestedSettings) {
                    Object.assign(invalid, nestedSettings[fieldName].getInvalidVariables());
                }
            }
        }

        return invalid;
    }

    /**
     * Verifies the configuration by collecting all variables and identifying invalid ones.
     * @returns An object containing:
     * - variables: Record of all defined variables
     * - missing: Record of all invalid/missing variables
     * - count: Statistics object with:
     *   - variables: Total number of variables
     *   - optional: Number of optional variables
     *   - secret: Number of secret variables
     *   - missing: Number of missing variables
     * - stringify: Bound method to convert configuration to string
     */
    verify() {
        const variables = this.getVariables(true);
        const missing = this.getInvalidVariables(true);
        return {
            variables,
            missing,
            count: {
                variables: Object.keys(variables).length,
                optional: Object.values(variables).filter(v => v.optional).length,
                secret: Object.values(variables).filter(v => v.secret).length,
                missing: Object.keys(missing).length,
            },
            stringify: this.stringify.bind(this),
        };
    }

    /**
     * Converts the settings into a human-readable string representation.
     * @param depth - The indentation depth level. Defaults to 0.
     * @param indent - The indentation string to use. Defaults to two spaces.
     * @returns A formatted string representing the settings hierarchy, with variables and nested settings.
     *
     * Variables are displayed in the format: `name=value (type)`, where:
     * - Secret values are masked as "***** (secret)"
     * - Type annotation is only shown for non-string types
     *
     * Nested settings are displayed with increased indentation and a colon suffix.
     */
    stringify(depth = 0, indent: string = "  "): string {
        const prefix = indent.repeat(depth);
        const result = [];
        const envvars = this.getVariables(false);
        for (const name in envvars) {
            const info = envvars[name];
            const value = info.secret ? "***** (secret)" : info.value;
            result.push(`${prefix}${name}=${value} ${info.type.name !== "string" ? ` (${info.type.name})` : ""}`);
        }

        const nestedSettings = this.getSettings(false);
        for (const fieldName in nestedSettings) {
            const settings = nestedSettings[fieldName];
            result.push(`${prefix}${fieldName}:`);
            result.push(settings.stringify(depth + 1));
        }

        return result.join("\n");
    }

    /**
     * Creates a configuration property in the given target's meta data.
     *
     * If the target is not an instance of Settings, the property descriptor is assigned to the target right away.
     *
     *
     * @template T - The type of the configuration property.
     * @param target - The target object to which the configuration property will be assigned.
     * @param fieldName - The name of the field for the configuration property.
     * @param settings - The property descriptor containing the configuration settings.
     */
    static createConfigurationProperty<T extends VarType>(
        target: any, fieldName: string, settings: IPropertyDescriptor<T>
    ) {
        Settings.storeConfigurationProperty(target, fieldName, settings);

        if (!(target instanceof Settings)) {
            Settings.assignConfigurationProperty(target, fieldName, settings);
        }
    }

    static storeConfigurationProperty<T extends VarType>(
        target: any, fieldName: string, settings: IPropertyDescriptor<T>
    ) {
        const storeKey = Settings.getMetaStoreKey(target);
        const props = Reflect.getMetadata(storeKey, target) || {};
        props[fieldName] = settings;

        Reflect.defineMetadata(storeKey, props, target);
    }

    static assignConfigurationProperty(
        target: any, fieldName: string, settings: IPropertyDescriptor<VarType>
    ) {
        const descriptor = Settings.createPropertyDescriptor(settings);
        Reflect.deleteProperty(target, fieldName);
        Reflect.defineProperty(target, fieldName, descriptor);
    }

    static assignConfigurationProperties(target: any) {
        const props = Settings.extractStoredVariables(target);
        for (const fieldName in props) {
            Settings.assignConfigurationProperty(target, fieldName, props[fieldName]);
        }
    }

    static getParentClass(target: any, base = false) {
        let baseClass = target instanceof Function ? target : target.constructor;

        while (baseClass) {
            const parentClass = Object.getPrototypeOf(baseClass);

            if (parentClass && parentClass !== Object && parentClass.name) {
                if (!base) {
                    return parentClass;
                }

                baseClass = parentClass;
            }
            else {
                break;
            }
        }

        return baseClass;
    }

    static createPropertyDescriptor<T extends VarType>(settings: IPropertyDescriptor<T>): PropertyDescriptor {

        const { name: varname, type, default: propertyDefault, source } = settings;

        let defaultValue = Value.isUndefined(propertyDefault)
            ? undefined
            : type.convert(String(propertyDefault));

        function get() {
            const value = source.getValue(varname);
            return type.convert(value, defaultValue);
        }

        /**
         * The setter will set the default value of the property. If the source value is not undefined,
         * it will still be used as the value of this property regardless of setting the default value.
         *
         * If the original default value is not undefined, only a defined value can overwrite it.
         */
        function set(value: VarType) {
            if (Value.isUndefined(propertyDefault) || !Value.isUndefined(value)) {
                defaultValue = type.convert(value);
            }
        }

        const descriptor = {
            enumerable: false,
            configurable: true,
            get,
            set
        } as PropertyDescriptor;

        return descriptor;
    }

    static getTypeName(target: any) {
        const funct = target instanceof Function ? target : target.constructor;
        return funct?.name;
    }

    static getMetaStoreKey(target: any) {
        const storeName = `${Settings.getTypeName(target)}_VARS`;
        return storeName;
    }

    static extractStoredVariables(target: any) {
        const result: Record<string, IPropertyDescriptor<VarType>> = {};
        let source = target;

        while (source) {
            const storeKey = Settings.getMetaStoreKey(source);
            const props = Reflect.getMetadata(storeKey, target) || {};

            Object.assign(result, props);

            const parent = Settings.getParentClass(source);
            if (parent === source) {
                break;
            }

            source = parent;
        }
        return result;
    }

    static initializeInstanceVariables(target: any) {

        const props = Settings.extractStoredVariables(target);
        for (const fieldName in props) {
            Settings.assignConfigurationProperty(target, fieldName, props[fieldName]);
        }
    }
}
