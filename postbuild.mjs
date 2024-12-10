import fs from "fs";
import path from "path";

const files = fs.readdirSync("./src", { recursive: true });
for (const file of files) {
    if ([".mjs", ".json"].includes(path.extname(file))) {
        const targetPath = `./dist/${file}`;
        if (!fs.existsSync(path.dirname(targetPath))) {
            fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        }

        fs.copyFileSync(`./src/${file}`, `./dist/${file}`);
    }
}
