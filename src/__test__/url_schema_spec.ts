import { expect } from "chai";

import { URLSchema } from "../url_schema";

describe(URLSchema.name, () => {
  describe("#constructor", () => {
    it("should parse pathComponents", () => {
      const urlSchema = new URLSchema<{
        gender: "men" | "women",
        productName: string,
        productId: string,
      }, {
        refresh?: string,
      }>({
        name: "Very Complex Path Template",
        description: "Very Complex Path Template",
        pathTemplate: "/:gender/view/:productName/:productId/test",
        params: {
          path: {
            gender: { type: "string", enum: ["men", "women"] },
            productName: { type: "string" },
            productId: { type: "string" },
          },
          query: {
            refresh: { type: "string", optional: true },
          }
        }
      });

      expect(urlSchema.pathComponents).to.be.deep.eq([
        {
          type: "const",
          value: "/",
        },
        {
          type: "parameter",
          name: "gender",
          schema: { type: "string", enum: ["men", "women"] }
        },
        {
          type: "const",
          value: "/view/",
        }, {
          type: "parameter",
          name: "productName",
          schema: { type: "string" }
        }, {
          type: "const",
          value: "/",
        }, {
          type: "parameter",
          name: "productId",
          schema: { type: "string" }
        }, {
          type: "const",
          value: "/test",
        },
      ]);
    });
  });

  describe("#toPathToRegexp", () => {
    it("should work", () => {
      const urlSchema = new URLSchema<{
        gender: "men" | "women",
        productName: string,
        productId: string,
      }, {
        refresh?: string,
      }>({
        name: "Very Complex Path Template",
        description: "Very Complex Path Template",
        pathTemplate: "/:gender/view/:productName/:productId/test",
        params: {
          path: {
            gender: { type: "string", enum: ["men", "women"] },
            productName: { type: "string" },
            productId: { type: "string" },
          },
          query: {
            refresh: { type: "string", optional: true },
          }
        }
      });

      expect(urlSchema.toPathToRegexp()).to.be.eq("/:gender(men|women)/view/:productName/:productId/test");
    });
  });

  describe("#parse", () => {
    it("should be able to parse very complicated url", () => {
      const urlSchema = new URLSchema<{
        gender: "men" | "women",
        productName: string,
        productId: string,
      }, {
        refresh?: string,
      }>({
        name: "Very Complex Path Template",
        description: "Very Complex Path Template",
        pathTemplate: "/:gender/view/:productName/:productId/test",
        params: {
          path: {
            gender: { type: "string", enum: ["men", "women"] },
            productName: { type: "string" },
            productId: { type: "string" },
          },
          query: {
            refresh: { type: "string", optional: true },
          }
        }
      });

      expect(urlSchema.parse("/men/view/rython-fuck/12345/test")).to.be.deep.eq({
        gender: "men",
        productId: "12345",
        productName: "rython-fuck",
      });

      expect(urlSchema.parse("/men/view/12345/test")).to.be.eq(null);
    });

    it("should parse based on enum if it exists", () => {
      const urlSchema = new URLSchema<{
        gender: "men" | "women",
      }, {}>({
        name: "Gender Enum Template",
        description: "Gender Enum Template",
        pathTemplate: "/:gender",
        params: {
          path: {
            gender: { type: "string", enum: ["men", "women"] },
          },
        }
      });

      expect(urlSchema.parse("/men")).to.be.deep.eq({ gender: "men" });

      expect(urlSchema.parse("/women")).to.be.deep.eq({ gender: "women" });

      expect(urlSchema.parse("/all")).to.be.null;
    });
  });
});
