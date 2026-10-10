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
];

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
  coordinates: [],
  slope: [],
  deriv_rate: [],
  motion_graphs: [],
  kin_1d: [],
};
