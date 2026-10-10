import type { NodeId } from "@/lib/types";

export interface ConceptScope {
  subject: "maths" | "physics" | "shared";
  skill: string;
  excludes: string;
  candidateMisconceptions: string[];
}

/** Authoring brief, pending builder review. These are not approved assessment items. */
export const CONCEPT_SCOPES: Record<NodeId, ConceptScope> = {
  coordinates: {
    subject: "maths",
    skill: "Read and plot ordered pairs; identify origin, axis labels and positive directions; interpret tick scales without confusing coordinates with changes.",
    excludes: "Slope calculation, distance and section formulae, and equations of lines.",
    candidateMisconceptions: ["coordinate_order_swapped", "axis_tick_value_ignored"],
  },
  trig: {
    subject: "maths",
    skill: "Identify opposite, adjacent and hypotenuse relative to a marked acute angle; use sin, cos and tan at standard angles.",
    excludes: "General identities, trigonometric equations, inverse functions and radians.",
    candidateMisconceptions: ["opposite_adjacent_swapped", "complementary_angle_ignored"],
  },
  vec_basics: {
    subject: "shared",
    skill: "Distinguish magnitude from direction; translate a free vector without changing it; add or subtract simple vectors graphically.",
    excludes: "Torque, products of vectors and advanced 3D geometry.",
    candidateMisconceptions: ["vector_equals_magnitude", "magnitudes_always_add"],
  },
  slope: {
    subject: "maths",
    skill: "Compute signed change in vertical quantity divided by change in horizontal quantity using the actual axis scales.",
    excludes: "Differentiation rules and equations of tangents to general curves.",
    candidateMisconceptions: ["slope_equals_height", "axis_scale_ignored"],
  },
  vec_comp: {
    subject: "shared",
    skill: "Resolve a 2D vector on perpendicular axes using the stated angle reference and component signs.",
    excludes: "Non-orthogonal bases and 3D resolution.",
    candidateMisconceptions: ["x_always_cos", "component_sign_ignored"],
  },
  deriv_rate: {
    subject: "maths",
    skill: "Interpret a derivative as local rate or tangent slope; distinguish it from average rate and function value.",
    excludes: "General symbolic differentiation, chain rule and formal limit proofs.",
    candidateMisconceptions: ["average_equals_instantaneous", "value_equals_rate"],
  },
  motion_graphs: {
    subject: "physics",
    skill: "Interpret signed slopes of position-time and velocity-time graphs and signed areas under simple velocity-time graphs.",
    excludes: "General integration and complicated piecewise discontinuities.",
    candidateMisconceptions: ["graph_height_equals_velocity", "area_equals_distance_always"],
  },
  kin_1d: {
    subject: "physics",
    skill: "Choose a sign convention and use displacement, velocity and constant-acceleration relations within their valid conditions.",
    excludes: "Variable-acceleration solution methods and multi-body constraints.",
    candidateMisconceptions: ["constant_acceleration_assumed", "distance_equals_displacement"],
  },
  projectile: {
    subject: "physics",
    skill: "Separate horizontal and vertical motion with a common time under uniform gravity and negligible air resistance.",
    excludes: "Drag, moving platforms, inclined-plane range and complicated collision problems.",
    candidateMisconceptions: ["same_height_formula_unconditional", "zero_velocity_at_apex"],
  },
};

/** Reasons for the locked live links, plus limits the content author must respect. */
export const LIVE_EDGE_REVIEW: Record<string, { rationale: string; limitation: string }> = {
  "coordinates->slope": {
    rationale: "Computing slope requires reading two points and the horizontal and vertical scales correctly before comparing changes.",
    limitation: "A correct coordinate reading does not establish understanding of ratios or signed subtraction.",
  },
  "trig->vec_comp": {
    rationale: "The selected component questions use right-triangle ratios and a marked reference angle.",
    limitation: "Do not make a vector-basics item secretly require trigonometric computation.",
  },
  "vec_basics->vec_comp": {
    rationale: "Components represent the magnitude and direction of the original vector.",
    limitation: "A component calculation alone does not test every vector-addition skill.",
  },
  "vec_comp->projectile": {
    rationale: "The demo resolves an oblique launch velocity along horizontal and vertical axes.",
    limitation: "Components may already be supplied in other projectile questions.",
  },
  "kin_1d->projectile": {
    rationale: "The vertical component follows a one-dimensional constant-acceleration equation.",
    limitation: "The component diagnostic does not test this sibling branch automatically.",
  },
  "slope->deriv_rate": {
    rationale: "Tangent slope develops the geometric interpretation of an instantaneous rate.",
    limitation: "This is an instructional route; it does not prove a student must learn derivatives graphically.",
  },
  "slope->motion_graphs": {
    rationale: "Slopes of position-time and velocity-time graphs represent velocity and acceleration.",
    limitation: "Area-under-graph questions also require geometry, which is below the live coverage floor.",
  },
  "deriv_rate->motion_graphs": {
    rationale: "The rate interpretation supports instantaneous velocity on a curved position-time graph.",
    limitation: "Formal calculus is not required for a straight-line graph or simple geometric area question.",
  },
  "motion_graphs->kin_1d": {
    rationale: "A straight velocity-time line motivates the constant-acceleration equations.",
    limitation: "This is a selected teaching route, not a necessary prerequisite for every equation-of-motion problem.",
  },
};

export const GRAPH_REVIEW_STATUS = {
  prerequisitePolicy: "idea_v3_locked_route",
  pedagogicalReview: "pending_builder_review",
  roadmapConnections: "proposed_display_only",
  ncertReferencesCheckedAt: "2026-10-10",
} as const;
