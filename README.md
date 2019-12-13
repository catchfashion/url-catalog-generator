# url-catalog
generates Typescript URL schemas that parse / serialize / support react-router.

## What's this for?
Modern App / Web requires singular url schema 
such as https://www.catchfashion.com/category/abcdef and catch://category/abcdef 
for this purpose, url-catalog-generator suggest centralized way of managing url schema.  
which could be used for 
- frontend routing, (react-router / path-to-regexp) 
- backend routing 

```json
const json = {
  "name": "CATCH",
  "urls": [
    {
      "name": "Home",
      "description": "Home page",
      "pathTemplate": "/:gender",
      "params": {
        "path": { "gender": { "type": "string", "enum": ["men", "women"] } }
      }
    },
    {
      "name": "Category",
      "description": "Category page",
      "pathTemplate": "/category/:categoryId",
      "params": {
        "path": { "categoryId": { "type": "string" } }
      }
    },
  ]
};
```
This JSON automatically generates below files  

(urls/Category.ts)
```typescript
import { URLSchema } from "url-catalog-generator";

type QueryParams = {};
type PathParams = {
  gender: "men" | "women", categoryId: string
};
type AllParams = QueryParams & PathParams;

export class Category {
  public static schema = new URLSchema<QueryParams, PathParams>({
    name: "Category",
    description: "category main show page",
    pathTemplate: "/:gender/category/:categoryId",
    params: {"path":{"gender":{"type":"string","enum":["men","women"]},"categoryId":{"type":"string"}}},
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
    return Category.schema.serialize(this.params);
  }
}
```

(urls/Home.ts)
```typescript
import { URLSchema } from "url-catalog-generator";

type QueryParams = {};
type PathParams = {
  gender: "men" | "women"
};

type AllParams = QueryParams & PathParams;

export class Home {
  public static schema = new URLSchema<QueryParams, PathParams>({
    name: "Home",
    description: "Home page",
    pathTemplate: "/:gender",
    params: {"path":{"gender":{"type":"string","enum":["men","women"]}}},
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
    return Home.schema.serialize(this.params);
  }
}

```

## Parse
```typescript
import { URLs } from "./urls";

const url = "some string';

function parseURL(url: string) {
  for (const schema of URLs) {
    let model = schema.parse(url);
    if (model) {
      return model;
    }
  }
}

const parsed = parseURL("/women");
if (parsed instanceof URLs.Home) {
  const gender = parsed.gender; // "men" / "women";
  console.log("its home!");
} else if (parse instanceof URLs.CategoryShow) {
  const categoryId = parsed.categoryId; // 
  console.log("it's category with id : ", categoryId);
}

```

## Serialize
```typescript
import { URLs } from "./urls";

new URLs.Home({ gender: "women" }).toString(); // "/women";
URLs.Home.serialize({ gender: "women" }); // "/women";
```

## Path-To-Regexp Format
```typescript
import { URLs } from "./urls";

URLs.Home.schema.toPathToRegexp() === "/:gender(women|men)";
```
