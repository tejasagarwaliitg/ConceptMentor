import { expect, it } from "vitest";
import { concludeSession } from "@/lib/engine";
import { start } from "./helpers";
it("does not diagnose a concept when its prerequisites remain untested", () => {
  const s = start("projectile").session!;
  s.probed = { projectile: "context_difficulty" };
  expect(concludeSession(s).outcome).toBe("inconclusive");
});
