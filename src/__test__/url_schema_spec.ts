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
});
