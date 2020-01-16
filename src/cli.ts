#!/usr/bin/env node
import program = require("commander");
import * as fs from "fs";
import * as path from "path";

import { URLSchemaConstructorOption } from "./url_schema";

const deleteFolderRecursive = function(target: string) {
  if (fs.existsSync(target)) {
    fs.readdirSync(target).forEach((file, index) => {
      const curPath = path.join(target, file);
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(target);
  }
};

program
  .command("generate <schemaJsonFile> <generateDest>")
  .action((schemaJsonFile: string, generateDestFolder: string) => {
    // Read Schema
    const schema = JSON.parse(fs.readFileSync(schemaJsonFile).toString()) as {
      name: string,
      urls: Array<URLSchemaConstructorOption<any, any>>
    };

    // fs.rmdirSync(generateDestFolder);
    deleteFolderRecursive(generateDestFolder);
    fs.mkdirSync(generateDestFolder);

    const urlFolder = `${generateDestFolder}/urls`;

    // // Copy URL Schema
    // fs.copyFileSync("./src/url_schema.ts", `${generateDestFolder}/url_schema.ts`);

    // Generate files from schema
    fs.mkdirSync(urlFolder);

    fs.copyFileSync(`${__dirname}/url_schema.js`, `${generateDestFolder}/url_schema.js`);
    fs.copyFileSync(`${__dirname}/url_schema.d.ts`, `${generateDestFolder}/url_schema.d.ts`);

    const urlFiles = schema.urls.map(url => {
      console.log(`Generating ${url.name}`);
      const className = url.name.split(" ").join("");
      const pathParamTSInterface = url.params?.path ? `{
        ${Object.keys(url.params.path).map(name => {
          const paramSchema = url.params!.path![name];
          return `${name}: ${(() => {
            switch (paramSchema.type) {
              case "string":
                if (paramSchema.enum) {
                  return paramSchema.enum.map(p => `"${p}"`).join(" | ");
                } else {
                  return "string";
                }
              case "number":
                if (paramSchema.enum) {
                  return paramSchema.enum.join(" | ");
                } else {
                  return "number";
                }
              }
          })()}`;
        }).join(", ")}
      }` : `{}`;

      const queryParamTSInterface = url.params?.query ? `{
        ${Object.keys(url.params!.query).map(name => {
          const paramSchema = url.params!.query![name];
          return `            ${name}${paramSchema.optional ? "?" : ""}: ${paramSchema.type}`;
        }).join("\n")}
      }` : `{}`;

      fs.writeFileSync(`${urlFolder}/${className}.ts`, `import { URLSchema } from "../url_schema";

type QueryParams = ${queryParamTSInterface};
type PathParams = ${pathParamTSInterface};

type AllParams = PathParams & QueryParams;

export class ${className} {
  public static schema = new URLSchema<PathParams, QueryParams>({
    name: "${url.name}",
    description: "${url.description}",
    pathTemplate: "${url.pathTemplate}",
    params: ${JSON.stringify(url.params)},
  });

  public static parse(path: string) {
    const params = this.schema.parse(path);
    return params && new this(params);
  }

  public static serialize(params: AllParams) {
    return new this(params).toString();
  }

  constructor(public readonly params: AllParams) {}

  public toString() {
    return ${className}.schema.serialize(this.params);
  }
}
`.split("\n").map(l => l.slice("".length)).join("\n"));
      return {
        className,
      };
    });

    fs.writeFileSync(`${urlFolder}/index.ts`,
    `
${urlFiles.map((url) => `import { ${url.className} } from "./${url.className}";`).join("\n")}

      export const URLs = {
        ${urlFiles.map((url) => `${url.className},`).join("\n")}
      } as const;
    `
    );
  });

program.parse(process.argv);
