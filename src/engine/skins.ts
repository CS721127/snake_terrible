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

export const SKIN_ASSETS: readonly SkinAsset[] = [
  skin("default", "DEFAULT", "01", "#9BFFC2", "#39FF6A"),
  skin("classic", "CLASSIC", "CL", "#FDE68A", "#F59E0B", "png"),
  skin("neon", "NEON", "NE", "#67E8F9", "#8B5CF6", "png"),
  skin("cockroach", "ROACH", "CR", "#C08457", "#7C4A2D"),
  skin("spider", "SPIDER", "SP", "#A78BFA", "#4C1D95"),
  skin("centipede", "CENTI", "CE", "#F87171", "#991B1B"),
  skin("mantis", "MANTIS", "MA", "#BEF264", "#3F6212"),
  skin("kangaroo", "ROO", "KA", "#FBBF24", "#92400E"),
  skin("ibis", "IBIS", "IB", "#F8FAFC", "#E11D48"),
  skin("unsw", "UNSW", "UN", "#FFE45E", "#111827"),
  skin("usyd", "USYD", "SY", "#EF4444", "#7F1D1D"),
  skin("unimelb", "UMELB", "UM", "#60A5FA", "#1E3A8A"),
  skin("anu", "ANU", "AN", "#93C5FD", "#1E40AF"),
  skin("monash", "MONASH", "MO", "#38BDF8", "#0F172A"),
  skin("macquarie", "MACQ", "MQ", "#FACC15", "#14532D"),
  skin("victoria", "VU", "VU", "#FB7185", "#881337"),
  skin("western", "WSU", "WS", "#F97316", "#7C2D12"),
];

export const AUTO_SKIN_IDS = SKIN_ASSETS
  .filter((skinAsset) => skinAsset.id !== "default")
  .map((skinAsset) => skinAsset.id);

export function getSkinAsset(skinId: string): SkinAsset {
  return SKIN_ASSETS.find((skinAsset) => skinAsset.id === skinId) ?? SKIN_ASSETS[0]!;
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
