import { expect } from "chai";

import { URLSchema } from "../url_schema";

export class ProductShow {
  public static schema = new URLSchema<{
    productId: string
  }, {
    refresh?: string,
  }>({
    name: "Product Show",
    description: "Product Show Page",
    pathTemplate: "/view/:productId",
    params: {
      path: {
        productId: { type: "string" },
      },
      query: {
        refresh: { type: "string", optional: true },
      }
    }
  });

  public static parse(path: string) {
    const params = this.schema.parse(path);
    return params && new this(params);
  }

  constructor(public readonly params: {
    productId: string
  } & {
    refresh?: string,
  }) {

  }

  public toString() {
    return ProductShow.schema.serialize(this.params);
  }
}

describe(ProductShow.name, () => {
  describe("#parse", () => {
    it("should be able to parse url with query", () => {
      const parsed = ProductShow.parse("/view/12345?refresh=abc");
      expect(parsed).to.be.instanceOf(ProductShow);
      expect(parsed!.params).to.be.deep.eq({
        productId: "12345",
        refresh: "abc",
      });
      expect(parsed!.toString()).to.be.eq("/view/12345?refresh=abc");
    });

    it("should be able to parse encoded url", () => {
      const parsed = ProductShow.parse("/view/%EC%8A%A4%ED%94%BC%EB%93%9C");
      expect(parsed).to.be.instanceOf(ProductShow);
      expect(parsed!.params).to.be.deep.eq({
        productId: "스피드",
      });
      expect(parsed!.toString()).to.be.eq("/view/%EC%8A%A4%ED%94%BC%EB%93%9C");
    });

    it("should be able to parse url without query", () => {
      const parsed = ProductShow.parse("/view/12345");
      expect(parsed).to.be.instanceOf(ProductShow);
      expect(parsed!.params).to.be.deep.eq({
        productId: "12345",
      });
      expect(parsed!.toString()).to.be.eq("/view/12345");
    });
  });

  describe("#toString", () => {
    it("should work with query param", () => {
      expect(
        new ProductShow({ productId: "12345", refresh: "abc" }).toString()
      ).to.be.eq("/view/12345?refresh=abc");
    });

    it("should work without any query params", () => {
      expect(
        new ProductShow({ productId: "12345" }).toString()
      ).to.be.eq("/view/12345");
    });
  });
});
