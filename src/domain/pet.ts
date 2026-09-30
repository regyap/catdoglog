export type PetSpecies = "Cat" | "Dog";

export interface NearbyPet {
  readonly name: string;
  readonly type: PetSpecies;
  readonly place: string;
  readonly near: string;
  readonly time: string;
  readonly mood: string;
  readonly tone: "orange" | "cream" | "gray";
}

export const nearbyPets: readonly NearbyPet[] = [
  { name: "Marmalade", type: "Cat", place: "Tiong Bahru Park", near: "120 m", time: "12 min", mood: "Friendly", tone: "orange" },
  { name: "Cloud", type: "Dog", place: "Eng Hoon Street", near: "350 m", time: "38 min", mood: "Needs water", tone: "cream" },
  { name: "Pepper", type: "Cat", place: "Kim Pong Park", near: "620 m", time: "2 hr", mood: "Shy", tone: "gray" },
] as const;
