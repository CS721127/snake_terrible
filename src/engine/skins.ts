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
 * UniversityAsset：拼接蛇皮肤里单个大学对应的视觉资源。
 * UNSW 永远占据 index 0（蛇头），其余大学依次填充蛇身，
 * 全部用完后从 index 0（UNSW）重新循环。
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

/** 拼接蛇的大学名单，顺序固定：UNSW 是头，之后依次是身体，用完循环回 UNSW。 */
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

/** 拼接蛇皮肤的固定 ID，渲染层用它判断是否走"逐段查大学"的特殊路径。 */
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
 * 按蛇身段位置（0 = 头）取出拼接蛇皮肤当前段对应的大学。
 * 用完整轮（UNSW..Western）后从 UNSW 重新循环，循环部分用的也是 UNSW 的 logo。
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
    // 约定路径 /assets/university/{id}/logo.png；文件不存在时 CanvasRenderer 里的
    // UniversityLogoCache 会加载失败并自动回退到下面的 placeholder（颜色块 + 缩写），
    // 不会导致渲染报错。
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
