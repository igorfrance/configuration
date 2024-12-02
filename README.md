# @igorf/configuration 

A TypeScript library for declarative configuration management using property decorators to access configuration parameters from different sources such as environment variables and command line arguments.

## Features

### Type-safe configuration using property decorators

The library provides strongly-typed property decorators in two categories:

- `scalar` - For single values (string, number, boolean)
- `list` - For array values (string[], number[], boolean[])

```typescript
import { env } from "@igorf/dotconfig";

class ServerConfig {
    @env.scalar.number("PORT")
    port: number = 3000;

    @env.list.string("ALLOWED_ORIGINS")
    allowedOrigins: string[] = ["localhost"];
}
```

### Support for environment variables and command line arguments 

Two built-in configuration sources are provided:

1. Environment Variables (`env`):
```typescript
@env.scalar("DATABASE_URL")
dbUrl: string;
```
2. Command-line Arguments (`argv`):
```typescript
@argv.scalar("--port")
port: number;
```
Both decorators support the same interface and types, allowing you to mix sources:

```typescript
class Config {
    // From environment variable
    @env.scalar.string("NODE_ENV")
    environment: string = "development";

    // From command line argument
    @argv.scalar.number("--port")
    port: number = 8080;
}
```
### Nested Configuration Objects

Settings classes can be nested to create hierarchical configurations:

```typescript
class DatabaseConfig extends Settings {
    @env.scalar("DB_HOST")
    host: string;
}

class AppConfig extends Settings {
    @env.scalar("APP_NAME")
    name: string;

    // Nested configuration
    database = new DatabaseConfig();
}
```
### Automatic type conversion

Values are automatically converted to their target types:

```typescript
class Config extends Settings {
    @env.scalar.number("PORT") // "3000" -> 3000
    port: number;

    @env.scalar.boolean("DEBUG") // "true" -> true
    debug: boolean;

    @env.list.number("LIMITS") // "1,2,3" -> [1,2,3]
    limits: number[];
}
```
### Optional and secret properties

Properties can be marked as optional or secret:

```typescript
class Config extends Settings {
    // Optional property - won't fail validation if missing
    @env.scalar({ name: "CACHE_TTL", optional: true })
    cacheTtl?: number;

    // Secret property - value will be masked in toString()
    @env.scalar({ name: "API_KEY", secret: true })
    apiKey: string;
}
```
### Validation and recursive validation

The Settings class provides built-in validation:

```typescript
const config = new Config();
const validation = config.verify();

console.log(validation);
// Outputs something like:
// {
//   variables: { /* all variables */ },
//   missing: { /* invalid/missing required variables */ },
//   count: {
//     variables: 10,  // total variables
//     optional: 2,    // optional variables
//     secret: 1,      // secret variables
//     missing: 1      // missing required variables
//   }
// }
```

Use recursive validation to check nested configurations:

```typescript
const invalidVars = config.getInvalidVariables(true); // true for recursive
```

## ES2022 Field Initialization Changes
Starting with ES2022, class fields are defined as part of the class body and are initialized during object construction. This can cause issues with the decorators provided by this library, as the properties created by the decorators may be overwritten by the class field initializers. Some of the ways to prevent this behaviour are:

1. Ensure that the class that uses the decorated fields derives from `Settings`; its constructor will automatically assign the configuration properties during the construction of the class object.
2. Assign the configuration properties within the constructor yoursef by adding the following instruction: `Settings.assignConfigurationProperties(this)`. 
3. Set `useDefineForClassFields` to `false` in `tsconfig.json`: This will revert to the previous behavior of field initialization, ensuring that the decorators work as expected.
