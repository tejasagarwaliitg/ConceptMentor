import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProfilePicker } from "@/components/ProfilePicker";
import { createProfile, freshStore, type ProfileStore } from "@/lib/profiles";

function renderPicker(store: ProfileStore = freshStore()) {
  return renderToStaticMarkup(createElement(ProfilePicker, {
    store,
    onSelect: () => {},
    onCreate: () => {},
    onUseDemo: () => {},
    onGuest: () => {},
  }));
}

describe("profile picker", () => {
  it("renders a labelled form with a disabled submit until a name is entered", () => {
    const html = renderPicker();
    expect(html).toContain('<main class="picker-main" id="main-content">');
    expect(html).toContain('<form class="picker-form">');
    expect(html).toContain('for="profile-name"');
    expect(html).toContain('id="profile-name"');
    expect(html).toContain('autoComplete="nickname" required=""');
    expect(html).toContain('for="profile-class"');
    expect(html).toContain('for="profile-exam"');
    expect(html).toContain('type="submit" disabled=""');
    expect(html).toContain('Class <span>Optional</span>');
    expect(html).toContain('Target exam <span>Optional</span>');
  });

  it("explains the empty state and keeps demo and guest entry available", () => {
    const html = renderPicker();
    expect(html).toContain("A fresh start awaits.");
    expect(html).toContain("Use demo account");
    expect(html).toContain("The demo uses simulated progress");
    expect(html).toContain("Continue as guest");
    expect(html).toContain("Guest progress stays separate from saved profiles.");
    expect(html).not.toContain('class="picker-profiles"');
  });

  it("shows saved profile details safely and labels demo history as simulated", () => {
    const profile = createProfile({ displayName: '<script>alert("x")</script>', classLabel: "Class 11", targetExam: "JEE Main 2027" });
    const demo = { ...createProfile({ displayName: "Demo" }), isDemo: true };
    const html = renderPicker({ activeId: null, profiles: { [profile.id]: profile, [demo.id]: demo } });
    expect(html).toContain("Welcome back.");
    expect(html).toContain('aria-label="Saved profiles"');
    expect(html).toContain("Class 11 · JEE Main 2027");
    expect(html).toContain("Simulated progress");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain('<script>alert("x")</script>');
    expect(html).not.toContain("A fresh start awaits.");
  });
});