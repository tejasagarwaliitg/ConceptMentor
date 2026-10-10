import type { NodeId } from "@/lib/types";

export interface StuckCard {
  id: "setup" | "calculation" | "interpretation";
  title: string;
  lines: string[];
}

/** Student-facing review-card drafts. An educator still needs to review every line. */
export const STUCK_CARDS_PART: Partial<Record<NodeId, StuckCard[]>> = {
  projectile: [
    { id: "setup", title: "Set up the axes and equations", lines: ["Choose axes: x horizontal and y vertical (upward positive).", "Resolve the initial velocity into components, using the axis from which the angle is measured.", "Horizontal acceleration is zero; vertical acceleration points downward.", "The elapsed time is the same for both components; this links their motion."] },
    { id: "calculation", title: "Check signs and quantities", lines: ["If upward is positive, g = −10 m/s² (or −9.8 m/s²).", "At maximum height, the vertical velocity is zero.", "Check units: m, s and m/s.", "Time cannot be negative; check whether your result is physically sensible."] },
    { id: "interpretation", title: "Identify what the question asks", lines: ["Maximum height, time of flight and range are three different quantities.", "Underline whether the angle is measured from the horizontal or the vertical.", "If the object returns to its launch height, its vertical displacement is zero."] },
  ],
  kin_1d: [
    { id: "setup", title: "Set up the motion", lines: ["Choose one positive direction and keep it consistent.", "List the known quantities (u, v, a, t, s) and the quantity you need.", "Choose an equation with just one unknown."] },
    { id: "calculation", title: "Check the calculation", lines: ["Check signs: initial velocity and acceleration can point in different directions.", "Keep units consistent.", "These equations apply only to constant acceleration."] },
    { id: "interpretation", title: "Understand what the question asks", lines: ["Distance and displacement are different quantities.", "At the instant an object stops, v = 0.", "A question asking how long something takes asks for time, not position."] },
  ],
  motion_graphs: [
    { id: "setup", title: "Read the graph axes", lines: ["First identify the graph: is it x–t or v–t?", "On x–t, slope is velocity. On v–t, slope is acceleration and area is displacement."] },
    { id: "calculation", title: "Calculate with the graph's scale", lines: ["Slope = change in y / change in x. Use the labelled tick values.", "Add area with its sign."] },
    { id: "interpretation", title: "Interpret the graph", lines: ["The shape of a graph is not the shape of the path travelled.", "A straight line has constant slope."] },
  ],
  vec_comp: [
    { id: "setup", title: "Choose axes and identify the angle", lines: ["Choose axes and note which axis the angle is measured from.", "Draw the vector as the hypotenuse of a right triangle."] },
    { id: "calculation", title: "Calculate the components", lines: ["Along the angle's reference axis: v cos θ. Perpendicular to it: v sin θ.", "Use the quadrant to determine the signs."] },
    { id: "interpretation", title: "Understand the angle reference", lines: ["An angle measured from the horizontal is different from one measured from the vertical.", "Vector components lie along perpendicular axes."] },
  ],
};
