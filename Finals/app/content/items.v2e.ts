import type { Item } from "./items.draft";

/** NEW BANK v2 — part 4b (projectile). */
export const ITEMS_V2E: Item[] = [
  {
    id: "projectile-A-height",
    node: "projectile",
    type: "A",
    stem: "A projectile is launched at $30^\\circ$ with speed $20$ m/s. What is its maximum height? ($g = 10$ m/s²)",
    options: ["$5$ m", "$10$ m", "$20$ m", "$2.5$ m"],
    answer: 0,
    tags: [null, "total_time_for_top", "uses_horizontal_speed", "wrong_value"],
    approved: false,
    source: { exam: "derived", year: 2026, topic: "Projectile motion" },
    derivation: "H = u^2 sin^2(theta) / 2g = 400 x 0.25 / 20 = 5 m",
    check: { formula: "20^2 * 0.5^2 / (2*10)", vars: {}, key: 5.0 },
    variant: { surface: "velocity", reference: "horizontal", target: "magnitude", representation: "text", trap: "uses_horizontal_speed" },
  },
  {
  "id": "projectile-B1-angle-from-vertical",
  "node": "projectile",
  "type": "B1",
  "stem": "A projectile is launched at $30^\\circ$ from the vertical with speed $20$ m/s. What is its initial horizontal velocity?",
  "options": [
    "$10$ m/s",
    "$17.3$ m/s",
    "$20$ m/s",
    "$0$ m/s"
  ],
  "answer": 0,
  "tags": [
    null,
    "angle_from_horizontal_assumed",
    "no_resolution",
    "zero_horizontal_velocity"
  ],
  "approved": false,
  "source": {
    "exam": "derived",
    "year": 2026,
    "topic": "Projectile motion"
  },
  "derivation": "The angle is measured from the vertical, so the horizontal component is 20 sin(30 degrees) = 10 m/s. Using 20 cos(30 degrees) gives 17.3 m/s and uses the wrong reference axis.",
  "variant": {
    "surface": "velocity",
    "reference": "vertical",
    "target": "x-component",
    "representation": "text",
    "trap": "angle_from_horizontal_assumed"
  },
  "check": {
    "formula": "20*sin(pi/6)",
    "vars": {}
  }
},
  {
    id: "projectile-B2-apex-speed",
    node: "projectile",
    type: "B2",
    stem: "A projectile is launched at $45^\\circ$ with speed $20$ m/s. What is its speed at the highest point of the flight?",
    options: ["$10\\sqrt{2}$ m/s", "$0$ m/s", "$20$ m/s", "$10$ m/s"],
    answer: 0,
    tags: [null, "zero_velocity_at_apex", "uses_horizontal_speed", "wrong_value"],
    approved: false,
    source: { exam: "derived", year: 2026, topic: "Projectile motion" },
    derivation: "at apex vy = 0 but vx unchanged: v = 20 cos45 = 14.14 = 10 sqrt(2)",
    check: { formula: "20*cos(pi/4)", vars: {}, key: 14.1421 },
    variant: { surface: "velocity", reference: "horizontal", target: "compare", representation: "text", trap: "zero_velocity_at_apex" },
  },
];
