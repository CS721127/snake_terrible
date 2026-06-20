import type { CSSProperties } from "react";
import { SKINS } from "@/app/constants";

interface SkinSelectorProps {
  readonly skinId: string;
  readonly onSkinChange: (skinId: string) => void;
  readonly readOnly: boolean;
}

export function SkinSelector({
  skinId,
  onSkinChange,
  readOnly,
}: SkinSelectorProps): JSX.Element {
  return (
    <section aria-label="Snake skin" className="skin-selector">
      <span className="skin-selector__label">SKIN</span>
      <div aria-label="Choose skin" className="skin-cards" role="listbox">
        {SKINS.map((skin) => (
          <button
            aria-selected={skin.id === skinId}
            className="skin-card"
            disabled={readOnly}
            key={skin.id}
            onClick={() => onSkinChange(skin.id)}
            role="option"
            type="button"
          >
            <span
              aria-hidden="true"
              className={
                skin.previewSrc
                  ? "skin-card__preview"
                  : "skin-card__preview skin-card__preview--placeholder"
              }
              style={
                skin.previewSrc
                  ? undefined
                  : {
                      "--skin-head": skin.placeholder.headColor,
                      "--skin-body": skin.placeholder.bodyColor,
                    } as CSSProperties
              }
            >
              {skin.previewSrc ? (
                <img alt="" src={skin.previewSrc} />
              ) : (
                <span className="skin-card__placeholder-text">
                  {skin.placeholder.initials.slice(0, 2)}
                </span>
              )}
            </span>
            <span className="skin-card__name">{skin.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
