import { describe, expect, it } from "vitest";
import { getSkinAsset, getUniversityLogoForSegment, SKIN_ASSETS } from "../skins";

describe("skins", () => {
  it("keeps the university skin head fixed to UNSW", () => {
    const universities = getSkinAsset("universities");

    expect(getUniversityLogoForSegment(universities, 0)?.id).toBe("unsw");
  });

  it("renders university body segments in the configured order", () => {
    const universities = getSkinAsset("universities");

    expect(getUniversityLogoForSegment(universities, 1)?.id).toBe("unimelb");
    expect(getUniversityLogoForSegment(universities, 2)?.id).toBe("usyd");
  });

  it("repeats UNSW after all configured universities and keeps three extra skins", () => {
    const universities = getSkinAsset("universities");
    const extraSkins = SKIN_ASSETS.filter(
      (skin) => skin.id !== "default" && skin.id !== "universities",
    );

    expect(getUniversityLogoForSegment(universities, 99)?.id).toBe("unsw");
    expect(extraSkins).toHaveLength(3);
  });
});
