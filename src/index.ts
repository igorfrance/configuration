import * as fs from "fs";

export const eslint = JSON.parse(fs.readFileSync(`${__dirname}/eslint/rules.json`, "utf-8"));
export * from "./settings";
export default { eslint };
