import { beforeEach, describe, expect, it } from "vitest";
import { HELPLINE, checkText, scrubPII } from "@/lib/safety";
import { accessAllowed, dailyCap, rateLimit, resetGuardsForTests } from "@/lib/guards";
import { containsBanned, validateProbeOrder, validateRepairOrder, validateStuckChoice } from "@/lib/mentor/schemas";

describe("safety gate (11.5)", () => {
  it.each([
    "main marna chahta hoon",
    "I want to die",
    "kill myself",
    "jeene ka mann nahi hai",
    "मुझे मरना चाहता हूँ",
  ])("distress text is caught: %s", (t) => {
    const v = checkText(t);
    expect(v.kind).toBe("distress");
    if (v.kind === "distress") expect(v.message).toContain(HELPLINE.number);
  });

  it("ordinary study text passes", () => {
    expect(checkText("projectile mein angle se components nikale").kind).toBe("ok");
    expect(checkText("I got the time of flight wrong").kind).toBe("ok");
  });

  it("abuse gets a neutral redirect, not an echo", () => {
    const v = checkText("this is bullshit fuck");
    expect(v.kind).toBe("abuse");
    if (v.kind === "abuse") expect(v.message.toLowerCase()).not.toContain("fuck");
  });

  it("PII is scrubbed before anything leaves the device", () => {
    const out = scrubPII("mera number 98765 43210 hai aur mail a.b@gmail.com");
    expect(out).not.toMatch(/98765/);
    expect(out).not.toContain("gmail");
  });
});

describe("guards (11.5)", () => {
  beforeEach(() => resetGuardsForTests());

  it("rate limit blocks after the limit and recovers after the window", () => {
    for (let i = 0; i < 3; i++) expect(rateLimit("ip1", 3, 1000, 0).ok).toBe(true);
    expect(rateLimit("ip1", 3, 1000, 10).ok).toBe(false);
    expect(rateLimit("ip1", 3, 1000, 2000).ok).toBe(true);
    expect(rateLimit("other", 3, 1000, 10).ok).toBe(true); // per key
  });

  it("daily cap eventually closes", () => {
    let ok = 0;
    for (let i = 0; i < 400; i++) if (dailyCap().ok) ok++;
    expect(ok).toBe(300);
  });

  it("AI mode is CLOSED when no access code is configured", () => {
    const prev = process.env.ACCESS_CODE;
    delete process.env.ACCESS_CODE;
    expect(accessAllowed("anything")).toBe(false);
    expect(accessAllowed("")).toBe(false);
    process.env.ACCESS_CODE = "s3cret";
    expect(accessAllowed("s3cret")).toBe(true);
    expect(accessAllowed("wrong")).toBe(false);
    expect(accessAllowed(null)).toBe(false);
    if (prev === undefined) delete process.env.ACCESS_CODE;
    else process.env.ACCESS_CODE = prev;
  });
});

describe("agent output is only ever a validated suggestion (11.2)", () => {
  it("probe order must be an exact permutation of the node's prerequisites", () => {
    expect(validateProbeOrder({ nodeId: "projectile", prereqOrder: ["kin_1d", "vec_comp"], reason: "x" })).not.toBeNull();
    expect(validateProbeOrder({ nodeId: "projectile", prereqOrder: ["vec_comp"], reason: "x" })).toBeNull(); // missing
    expect(validateProbeOrder({ nodeId: "projectile", prereqOrder: ["vec_comp", "trig"], reason: "x" })).toBeNull(); // not a prereq
    expect(validateProbeOrder({ nodeId: "projectile", prereqOrder: ["vec_comp", "vec_comp"], reason: "x" })).toBeNull(); // dup
    expect(validateProbeOrder({ nodeId: "nonsense", prereqOrder: [], reason: "x" })).toBeNull(); // invented node
  });

  it("stuck card must be one of the three reviewed cards", () => {
    expect(validateStuckChoice({ cardId: "setup", reason: "x" })).not.toBeNull();
    expect(validateStuckChoice({ cardId: "mark_everything_solid", reason: "x" })).toBeNull();
  });

  it("repair order can never drop the immediate check or repeat an option", () => {
    expect(validateRepairOrder({ order: ["contrast", "check", "read"], reason: "x" })).not.toBeNull();
    expect(validateRepairOrder({ order: ["contrast", "read", "video"], reason: "x" })).toBeNull();
    expect(validateRepairOrder({ order: ["check", "check"], reason: "x" })).toBeNull();
    expect(validateRepairOrder({ order: ["https://evil.example"], reason: "x" })).toBeNull(); // no URLs
  });

  it("banned words are detected, ordinary words are not", () => {
    expect(containsBanned("you are weak at this")).toBe(true);
    expect(containsBanned("you failed")).toBe(true);
    expect(containsBanned("Weakness found? No. Keep going")).toBe(false);
  });
});
