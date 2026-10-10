/**
 * Builder-curated video allowlist. Every entry below points at a real published
 * video; each ID, start time, and length needs educator re-verification at the
 * pre-freeze check before public use.
 *
 * Store IDs only — URLs are built in lib/videos.ts where the host allowlist is
 * enforced in one place. Nodes without curation stay empty: downstream renders
 * the NCERT read-instead block, never a blank section.
 */
import type { NodeId } from "@/lib/types";
import type { Channel, VideoResource } from "@/lib/videos";

export const CHANNELS: Channel[] = [
  { id: "physics-wallah", name: "Physics Wallah - Alakh Pandey" },
  { id: "pw-jee", name: "PW JEE" },
  { id: "jee-wallah", name: "JEE Wallah" },
  { id: "competishun", name: "Competishun" },
  { id: "physics-galaxy", name: "Physics Galaxy" },
  { id: "etoosindia", name: "EtoosIndia" },
  { id: "unacademy-jee", name: "Unacademy JEE" },
  { id: "vedantu-jee", name: "Vedantu JEE" },
  { id: "allen", name: "ALLEN Career Institute" },
  { id: "apni-kaksha", name: "Apni Kaksha" },
  { id: "aman-dhattarwal", name: "Aman Dhattarwal" },
  { id: "magnet-brains", name: "Magnet Brains" },
  { id: "tutorialspoint", name: "TutorialsPoint" },
  { id: "quantum-lab", name: "Quantum Lab: The E-Pathshala" },
  { id: "khan-academy", name: "Khan Academy" },
  { id: "apna-college", name: "Apna College" },
  { id: "physics-wallah-foundation", name: "Physics Wallah Foundation" },
];

/** Channels preselected for every new profile (the student can change them). */
export const DEFAULT_PREFERRED_CHANNELS = ["physics-wallah", "apna-college", "vedantu-jee"];

export const VIDEO_RESOURCES: Record<NodeId, VideoResource[]> = {
  projectile: [
    {
      id: "iUi1M7YkDe4",
      title: "Projectile Motion 01 || Class 11 chap 4 || Motion in a Plane || Motion in 2-D ||",
      channelId: "physics-wallah",
      startAt: 0,
      lengthSec: 3951,
      sizeMB: 35,
      tags: ["angle_from_horizontal_assumed"],
    },
    {
      id: "64XCP66W8kQ",
      title: "KINEMATICS 04 || PROJECTILE MOTION in ONE SHOT || ALL Tricks & Concepts | NEET Physics Crash Course",
      channelId: "physics-wallah",
      startAt: 0,
      lengthSec: 4837,
      sizeMB: 40,
      tags: ["total_time_for_top"],
    },
  ],
  vec_comp: [
    {
      id: "aeMhFD4No3M",
      title: "Vectors 05 : Resolution Of Vector || Unit Vector || Cartesian form of Vector - Basics",
      channelId: "physics-wallah",
      startAt: 0,
      lengthSec: 5061,
      sizeMB: 42,
      tags: ["swapped_sin_cos", "recipe_always_cos_x"],
    },
    {
      id: "Kt3Xeno6Jks",
      title: "Vectors L05 | Unit Vector & Resolution of Vectors | Class 11 Physics | JEE/NEET | Complete Concept",
      channelId: "quantum-lab",
      startAt: 0,
      lengthSec: 2345,
      sizeMB: 20,
      tags: ["cos_always_for_x", "sin_cos_swapped"],
    },
  ],
  trig: [
    {
      id: "kVTjZPNiXB4",
      title: "Trigonometric Ratios - Introduction to Trigonometry | Class 10 Maths Chapter 8 | CBSE",
      channelId: "magnet-brains",
      startAt: 0,
      lengthSec: 5189,
      sizeMB: 45,
      tags: ["opposite_adjacent_swapped"],
    },
    {
      id: "5RNijObrYIk",
      title: "Class 10th - Trigonometric Ratios | Introduction to Trigonometry | Tutorials Point",
      channelId: "tutorialspoint",
      startAt: 0,
      lengthSec: 627,
      sizeMB: 5,
      tags: ["adjacent_for_sin"],
    },
  ],
  vec_basics: [
    {
      id: "zHhIlBOiLV0",
      title: "CLass 11 : Chapter 4 VECTOR 02 || VECTOR ADDITION || PARALLELOGRAM LAW OF VECTOR AADDITION ||",
      channelId: "physics-wallah",
      startAt: 0,
      lengthSec: 3642,
      sizeMB: 30,
      tags: ["adds_magnitudes"],
    },
    {
      id: "Ka7JjFI6eDY",
      title: "VECTORS in ONE SHOT | All Concepts & PYQs Covered | Basic to Advanced | Class 11th JEE",
      channelId: "pw-jee",
      startAt: 0,
      lengthSec: 21173,
      sizeMB: 175,
      tags: ["pythagoras_always"],
    },
  ],
  coordinates: [
    {
      id: "9Us5-Q0V_C4",
      title: "Complete Coordinate Geometry in One Video by Ritik Sir || Chapter - 7 || Class 10 Maths",
      channelId: "physics-wallah-foundation",
      startAt: 0,
      lengthSec: 6504,
      sizeMB: 54,
      tags: [],
    },
  ],
  slope: [
    {
      id: "XBwek6VFHcs",
      title: "Slope of a Line - Straight Lines | Class 11 Maths Chapter 9 | CBSE 2025-26",
      channelId: "magnet-brains",
      startAt: 0,
      lengthSec: 2789,
      sizeMB: 23,
      tags: [],
    },
  ],
  deriv_rate: [
    {
      id: "dU_HjFdIgLc",
      title: "Concept of Derivative as a Rate Measurer - Differentiation | Class 11 Maths",
      channelId: "magnet-brains",
      startAt: 0,
      lengthSec: 829,
      sizeMB: 7,
      tags: [],
    },
    {
      id: "N2PpRnFqnqY",
      title: "Derivative as a concept | Derivatives introduction | AP Calculus AB | Khan Academy",
      channelId: "khan-academy",
      startAt: 0,
      lengthSec: 436,
      sizeMB: 4,
      tags: [],
    },
  ],
  motion_graphs: [
    {
      id: "4OgPa7MKjRA",
      title: "11 chap 03 : Kinematics 05 | Displacement time Graph -Velocity time Graph - Acceleration time Graph",
      channelId: "physics-wallah",
      startAt: 0,
      lengthSec: 2697,
      sizeMB: 22,
      tags: [],
    },
  ],
  kin_1d: [
    {
      id: "eQhOAHMankc",
      title: "KINEMATICS 01 || Motion in a Straight Line || 1-D Motion || NEET Physics Crash Course",
      channelId: "physics-wallah",
      startAt: 0,
      lengthSec: 6676,
      sizeMB: 56,
      tags: [],
    },
  ],
};
