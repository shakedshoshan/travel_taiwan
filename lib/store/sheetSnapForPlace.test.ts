import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { sheetSnapAfterPlaceFocus } from "./sheetSnapForPlace.ts";

describe("sheetSnapAfterPlaceFocus", () => {
  it("opens place at half from peek/half", () => {
    assert.equal(
      sheetSnapAfterPlaceFocus("attr-1", "taipei", "peek"),
      "half"
    );
    assert.equal(
      sheetSnapAfterPlaceFocus("attr-1", "taipei", "half"),
      "half"
    );
  });

  it("keeps full when already full", () => {
    assert.equal(
      sheetSnapAfterPlaceFocus("attr-1", "taipei", "full"),
      "full"
    );
  });

  it("returns peek when clearing place in city", () => {
    assert.equal(sheetSnapAfterPlaceFocus(null, "taipei", "half"), "peek");
  });

  it("closes when no city and no place", () => {
    assert.equal(sheetSnapAfterPlaceFocus(null, null, "peek"), "closed");
  });
});
