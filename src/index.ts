import { env } from "./decorators";
//import { Settings } from "./settings";

class Subject {
    prop1: string = "matter";

    @env.scalar("SystemRoot")
    prop2: string;

}

console.log(new Subject().prop1);
console.log(new Subject().prop2);

export * from "./settings";
export * from "./decorators";
