export interface SkinAsset {
  readonly id: string;
  readonly label: string;
  readonly headSrc?: string;
  readonly bodySrc?: string;
  readonly previewSrc?: string;
  readonly placeholder: {
    readonly initials: string;
    readonly headColor: string;
    readonly bodyColor: string;
  };
}

/**
 * UniversityAsset: visual asset for one university in the stitched snake skin.
 * UNSW always occupies index 0 (head); other universities fill the body in order,
 * then cycle back from index 0 (UNSW) when the roster is exhausted.
 */
export interface UniversityAsset {
  readonly id: string;
  readonly label: string;
  readonly logoSrc?: string;
  readonly placeholder: {
    readonly initials: string;
    readonly color: string;
  };
}

/** University roster for the stitched snake skin, fixed order: UNSW is head, then body segments, cycling back to UNSW. */
export const UNIVERSITY_ROSTER: readonly UniversityAsset[] = [
  university("unsw", "UNSW", "UN", "#FFE45E"),
  university("unimelb", "UMELB", "UM", "#60A5FA"),
  university("usyd", "USYD", "SY", "#EF4444"),
  university("anu", "ANU", "AN", "#93C5FD"),
  university("monash", "MONASH", "MO", "#38BDF8"),
  university("macquarie", "MACQ", "MQ", "#FACC15"),
  university("victoria", "VU", "VU", "#FB7185"),
  university("western", "WSU", "WS", "#F97316"),
];

/** Fixed ID for the stitched snake skin; the renderer uses it to choose the per-segment university lookup path. */
export const UNIVERSITY_SKIN_ID = "university";

export const SKIN_ASSETS: readonly SkinAsset[] = [
  skin("default", "DEFAULT", "01", "#9BFFC2", "#39FF6A"),
  skin(UNIVERSITY_SKIN_ID, "UNI", "UN", UNIVERSITY_ROSTER[0]!.placeholder.color, "#1E3A8A"),
  skin("classic", "CLASSIC", "CL", "#FDE68A", "#F59E0B", "png"),
  skin("neon", "NEON", "NE", "#67E8F9", "#8B5CF6", "png"),
];

export const AUTO_SKIN_IDS = SKIN_ASSETS
  .filter((skinAsset) => skinAsset.id !== "default")
  .map((skinAsset) => skinAsset.id);

export function getSkinAsset(skinId: string): SkinAsset {
  return SKIN_ASSETS.find((skinAsset) => skinAsset.id === skinId) ?? SKIN_ASSETS[0]!;
}

/**
 * Get the university for the stitched snake skin at a body segment index (0 = head).
 * After a full cycle (UNSW..Western), loop back to UNSW; loop segments also use UNSW's logo.
 */
export function getUniversityForSegment(segmentIndex: number): UniversityAsset {
  const roster = UNIVERSITY_ROSTER;
  const index = segmentIndex % roster.length;
  return roster[index] ?? roster[0]!;
}

function university(
  id: string,
  label: string,
  initials: string,
  color: string,
): UniversityAsset {
  return {
    id,
    label,
    // Conventional path /assets/university/{id}/logo.png; if the file is missing, UniversityLogoCache
    // in CanvasRenderer fails to load and falls back to the placeholder below (color block + initials),
    // without causing a render error.
    logoSrc: `/assets/university/${id}/logo.png`,
    placeholder: { initials, color },
  };
}

function skin(
  id: string,
  label: string,
  initials: string,
  headColor: string,
  bodyColor: string,
  extension?: "png",
): SkinAsset {
  const base = `/assets/snake/${id}`;
  const imagePaths = extension
    ? {
        headSrc: `${base}/head.${extension}`,
        bodySrc: `${base}/body.${extension}`,
        previewSrc: `${base}/head.${extension}`,
      }
    : {};

  return {
    id,
    label,
    ...imagePaths,
    placeholder: {
      initials,
      headColor,
      bodyColor,
    },
  };
}
