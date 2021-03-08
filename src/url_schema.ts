interface VariablePathComponent {
  type: "parameter";
  name: string;
  schema: PathParamSchema;
}

interface ConstPathComponent {
  type: "const";
  value: string;
}

type PathComponent =
  | VariablePathComponent
  | ConstPathComponent;

type PathParamSchema = (
  | { type: "string", enum?: string[] }
  | { type: "number", enum?: number[] }
);

type QueryParamSchema = (
  | { type: "string", optional?: boolean, enum?: string[] }
  | { type: "number", optional?: boolean, enum?: number[] }
);

export interface URLSchemaConstructorOption<PathParams, QueryParams> {
  name: string;
  description: string;
  pathTemplate: string;
  params?: {
    path?: { [key in keyof PathParams]: PathParamSchema },
    query?: { [key in keyof QueryParams]: QueryParamSchema }
  };
}

export class URLSchema<
  PathParams extends { [key: string]: string | number },
  QueryParams extends { [key: string]: string | number | undefined },
> {
  public readonly pathComponents: PathComponent[];

  constructor(
    public readonly options: URLSchemaConstructorOption<PathParams, QueryParams>
  ) {
    this.pathComponents = [];

    const regex = /\:\w+/;
    let template = this.options.pathTemplate;
    while (template.length > 0) {
      const matched = template.match(regex);
      if (matched) {
        const variableTemplate = matched[0];
        const variableTemplateName = variableTemplate.slice(1); // takeout ":"
        const variableTemplateIndex = matched.index!;

        const schema = this.options.params?.path![variableTemplateName];
        if (!schema) {
          throw new Error(`Path Parameter ${variableTemplateName} hasn't been defined but provided on pathTemplate`);
        }

        if (variableTemplateIndex > 0) {
          this.pathComponents.push({
            type: "const", value: template.slice(0, variableTemplateIndex),
          });
        }

        this.pathComponents.push({
          type: "parameter",
          name: variableTemplateName,
          schema,
        });
        template = template.slice(variableTemplateIndex + variableTemplate.length);
      } else {
        this.pathComponents.push({
          type: "const", value: template,
        });
        template = "";
      }
    }
  }

  public parse(url: string) {
    let [path, query] = url.split("?");
    const output: Partial<PathParams & QueryParams> = {};

    try {
      // Check Path validity
      for (const pathComponent of this.pathComponents) {
        switch (pathComponent.type) {
          case "const": {
            if (path.startsWith(pathComponent.value)) {
              // Valid
              path = path.slice(pathComponent.value.length);
              break;
            } else {
              // Invalid.
              throw new Error(`it should starts with ${pathComponent.value} but it's ${path}`);
            }
          }
          case "parameter": {
            const nextSlashIndex = path.indexOf("/");
            const potentialPart = path.slice(0, nextSlashIndex >= 0 ? nextSlashIndex : undefined);
            switch (pathComponent.schema.type) {
              case "number": {
                const decoded = Number(decodeURIComponent(potentialPart));
                if (isNaN(decoded)) {
                  return null;
                }
                (output as any)[pathComponent.name] = decoded;
                break;
              }
              case "string": {
                const decoded = decodeURIComponent(potentialPart);
                if (pathComponent.schema?.enum) {
                    if (pathComponent.schema.enum.find((value) => value === decoded)) {
                      (output as any)[pathComponent.name] = decoded;
                    } else {
                      throw new Error(`${pathComponent.name} should include one of [${pathComponent.schema.enum.join(", ]")}]`)
                    }
                } else {
                  (output as any)[pathComponent.name] = decoded;
                }
                break;
              }
            }

            if (nextSlashIndex >= 0) {
              path = path.slice(nextSlashIndex);
            } else {
              path = "";
            }
          }
        }
      }
      if (path.length > 0) {
        // there are path left that hasn't been defined
        return null;
      }

      if (query) {
        // Check Query
        query.split("&")
          .map(p => p.split("=").map(d => decodeURIComponent(d)) as [string, string])
          .map(([key, value]) => {
            (output as any)[key] = value;
          });
      }
    } catch (e) {
      return null;
    }

    return output as (PathParams & QueryParams);
  }

  public serialize(params: PathParams & QueryParams) {
    const path = this.pathComponents.map((c) => {
      switch (c.type) {
        case "const": return c.value;
        case "parameter": {
          const paramKey = c.name as keyof PathParams;
          const v = params[paramKey];
          if (v === undefined) {
            throw new Error(`Path param ${c.name} is missing`);
          }
          return encodeURIComponent(v.toString());
        }
      }
    }).join("");
    const query = this.options.params?.query ? Object.keys(this.options.params.query)
      .map(p => [p, params[p]])
      .filter(p => !!p[1])
      .map(p => p.map(r => encodeURIComponent(r)).join("="))
      .join("&") : "";

    return `${path}${query.length > 0 ? `?${query}` : ``}`;
  }

  // tslint:disable-next-line
  private __pathToRegexp: string | null = null;

  public toPathToRegexp() {
    if (!this.__pathToRegexp) {
      this.__pathToRegexp = this.pathComponents.map((c) => {
        switch (c.type) {
          case "const": {
            return c.value;
          } case "parameter": {
            return `:${c.name}${c.schema.enum ? `(${c.schema.enum.join("|")})` : ""}`;
          }
        }
      }).join("");
    }
    return this.__pathToRegexp;
  }
}
