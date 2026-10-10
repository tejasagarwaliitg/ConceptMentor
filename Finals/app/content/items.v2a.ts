import type { Item } from "./items.draft";

/** NEW BANK v2 — part 1 (foundations). No two items share (surface, reference, target). */
export const ITEMS_V2A: Item[] = [
  {
  "id": "coordinates-A-ordered-pair",
  "node": "coordinates",
  "type": "A",
  "stem": "A point is 3 units to the right of the origin and 4 units above it. What are its coordinates?",
  "options": [
    "$(3, 4)$",
    "$(4, 3)$",
    "$(-3, 4)$",
    "$(3, -4)$"
  ],
  "answer": 0,
  "tags": [
    null,
    "coordinate_order_swapped",
    "sign_error",
    "sign_error"
  ],
  "approved": false,
  "source": {
    "exam": "derived",
    "year": 2026,
    "topic": "Coordinates and axes"
  },
  "derivation": "Positive x points right and positive y points up, so x = 3 and y = 4. The ordered pair is (3, 4).",
  "variant": {
    "surface": "position",
    "reference": "horizontal",
    "target": "direction",
    "representation": "text",
    "trap": "coordinate_order_swapped"
  },
  "check": {
    "formula": "3",
    "vars": {},
    "components": [
      "3",
      "4"
    ]
  }
},
  {
    id: "coordinates-B1-tick-scale",
    node: "coordinates",
    type: "B1",
    stem: "On a graph, one tick on each axis equals **5 units**. A point lies 3 ticks right of the origin and 2 ticks below it. What are its coordinates?",
    options: ["$(15, -10)$", "$(3, -2)$", "$(-10, 15)$", "$(5, -5)$"],
    answer: 0,
    tags: [null, "axis_tick_value_ignored", "coordinate_order_swapped", "wrong_scale"],
    approved: false,
    source: { exam: "derived", year: 2026, topic: "Reading graphs" },
    derivation: "x = 3 x 5 = 15; y = -2 x 5 = -10",
    variant: { surface: "position", reference: "graph-scale", target: "magnitude", representation: "graph", trap: "axis_tick_value_ignored" },
    check: { formula: "3*5", vars: {}, components: ["3*5", "-2*5"] },
  },
  {
    id: "coordinates-B2-sign-in-quadrant",
    node: "coordinates",
    type: "B2",
    stem: "A particle moves from $(2, -5)$ through the displacement $(-7, 6)$. Where does it end up?",
    options: ["$(-5, 1)$", "$(-5, -1)$", "$(5, -1)$", "$(9, -11)$"],
    answer: 0,
    tags: [null, "sign_error", "sign_error", "adds_magnitudes"],
    approved: false,
    source: { exam: "derived", year: 2026, topic: "Coordinate geometry" },
    derivation: "end = (2-7, -5+6) = (-5, 1)",
    variant: { surface: "displacement", reference: "negative-x", target: "direction", representation: "text", trap: "sign_error" },
    check: { formula: "2-7", vars: {}, components: ["2-7", "-5+6"] },
  },

  {
    id: "trig-A-right-triangle-ratio",
    node: "trig",
    type: "A",
    stem: "In a right triangle the sides about the right angle are in ratio $3:4$ and the hypotenuse is $25$. What is the smaller acute angle?",
    options: ["$37^\\circ$", "$53^\\circ$", "$30^\\circ$", "$45^\\circ$"],
    answer: 0,
    tags: [null, "complementary_angle_ignored", "opposite_adjacent_swapped", "wrong_value"],
    approved: false,
    source: { exam: "derived", year: 2026, topic: "Trigonometry" },
    derivation: "sides 15,20,25; smaller angle opposite smaller side: tan = 15/20 = 0.75 -> 36.87 deg",
    variant: { surface: "length", reference: "other-angle", target: "direction", representation: "diagram", trap: "complementary_angle_ignored" },
    check: { formula: "atan(3/4)*180/pi", vars: {} },
  },
  {
    id: "trig-B1-kite-elevation",
    node: "trig",
    type: "B1",
    stem: "A kite string is $40$ m long and makes an angle of $35^\\circ$ with the **horizontal**. How high is the kite?",
    options: ["$22.9$ m", "$32.8$ m", "$40$ m", "$28.6$ m"],
    answer: 0,
    tags: [null, "opposite_adjacent_swapped", "complementary_angle_ignored", "wrong_value"],
    approved: false,
    source: { exam: "derived", year: 2026, topic: "Heights and distances" },
    derivation: "height = 40 sin(35) = 22.94. The adjacent component 40 cos(35) = 32.77 is the trap.",
    variant: { surface: "length", reference: "horizontal", target: "y-component", representation: "word-problem", trap: "opposite_adjacent_swapped" },
    check: { formula: "40*sin(35*pi/180)", vars: {} },
  },
  {
    id: "trig-B2-pole-shadow",
    node: "trig",
    type: "B2",
    stem: "A vertical pole casts a shadow of $60$ m when the sun's angle of elevation is $40^\\circ$. How tall is the pole?",
    options: ["$50.3$ m", "$71.5$ m", "$60$ m", "$45.4$ m"],
    answer: 0,
    tags: [null, "opposite_adjacent_swapped", "complementary_angle_ignored", "wrong_value"],
    approved: false,
    source: { exam: "derived", year: 2026, topic: "Heights and distances" },
    derivation: "height = 60 tan(40) = 50.34. Using the complement gives 60 tan(50) = 71.5.",
    variant: { surface: "length", reference: "vertical", target: "y-component", representation: "word-problem", trap: "complementary_angle_ignored" },
    check: { formula: "60*tan(40*pi/180)", vars: {} },
  },
];

