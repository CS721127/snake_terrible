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
                  : "skin-card__preview skin-card__preview--default"
              }
            >
              {skin.previewSrc ? <img alt="" src={skin.previewSrc} /> : null}
            </span>
            <span className="skin-card__name">{skin.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

