export interface SkinAsset {
  readonly id: string;
  readonly label: string;
  readonly headSrc?: string;
  readonly bodySrc?: string;
  readonly previewSrc?: string;
  readonly universityLogos?: readonly UniversityLogo[];
  readonly repeatUniversityId?: string;
  readonly placeholder: {
    readonly initials: string;
    readonly headColor: string;
    readonly bodyColor: string;
  };
}

export interface UniversityLogo {
  readonly id: string;
  readonly label: string;
  readonly initials: string;
  readonly backgroundColor: string;
  readonly borderColor: string;
  readonly textColor: string;
}

const UNIVERSITY_LOGOS: readonly UniversityLogo[] = [
  university("unsw", "UNSW Sydney", "UNSW", "#FFE600", "#111827", "#111827"),
  university("unimelb", "University of Melbourne", "MELB", "#094183", "#6BADE4", "#F8FAFC"),
  university("usyd", "University of Sydney", "USYD", "#E5251F", "#FDE2E0", "#FFFFFF"),
  university("anu", "Australian National University", "ANU", "#003C71", "#FCD34D", "#FFFFFF"),
  university("monash", "Monash University", "MON", "#006DAE", "#99D6F5", "#FFFFFF"),
  university("macquarie", "Macquarie University", "MQ", "#0B5D3B", "#F6C85F", "#FFFFFF"),
  university("uts", "University of Technology Sydney", "UTS", "#111827", "#EF4444", "#FFFFFF"),
  university("western", "Western Sydney University", "WSU", "#B91C1C", "#F97316", "#FFFFFF"),
];

export const SKIN_ASSETS: readonly SkinAsset[] = [
  skin("default", "DEFAULT", "01", "#9BFFC2", "#39FF6A"),
  {
    id: "universities",
    label: "UNIVERSITIES",
    universityLogos: UNIVERSITY_LOGOS,
    repeatUniversityId: "unsw",
    placeholder: {
      initials: "UNSW",
      headColor: "#FFE600",
      bodyColor: "#111827",
    },
  },
  skin("classic", "CLASSIC", "CL", "#FDE68A", "#F59E0B", "png"),
  skin("neon", "NEON", "NE", "#67E8F9", "#8B5CF6", "png"),
  skin("cockroach", "ROACH", "CR", "#C08457", "#7C4A2D"),
];

export function getSkinAsset(skinId: string): SkinAsset {
  return SKIN_ASSETS.find((skinAsset) => skinAsset.id === skinId) ?? SKIN_ASSETS[0]!;
}

export function getUniversityLogoForSegment(
  skinAsset: SkinAsset,
  segmentIndex: number,
): UniversityLogo | null {
  const logos = skinAsset.universityLogos;
  if (!logos?.length) return null;

  const directLogo = logos[segmentIndex];
  if (directLogo) return directLogo;

  return (
    logos.find((logo) => logo.id === skinAsset.repeatUniversityId) ??
    logos[0] ??
    null
  );
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

function university(
  id: string,
  label: string,
  initials: string,
  backgroundColor: string,
  borderColor: string,
  textColor: string,
): UniversityLogo {
  return {
    id,
    label,
    initials,
    backgroundColor,
    borderColor,
    textColor,
  };
}
