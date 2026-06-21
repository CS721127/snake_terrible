import { FOOD_LEGEND } from "@/engine/bitwise/FoodLegend";

/**
 * FoodLegendPanel: right-side food legend sidebar (per todo.md).
 *
 * Maps shape/color ↔ operation type only; does not show specific values —
 * values are random in-game (2-digit hex); the legend only teaches
 * "which color is which bitwise op"; shift foods are labeled "no value".
 */
export function FoodLegendPanel(): JSX.Element {
  return (
    <aside aria-label="Food legend" className="food-legend">
      <span className="food-legend__title">FOOD_LEGEND</span>
      <ul className="food-legend__list">
        {FOOD_LEGEND.map((entry) => (
          <li className="food-legend__item" key={entry.operation}>
            <span
              aria-hidden="true"
              className="food-legend__swatch"
              style={{ color: entry.color, borderColor: entry.color }}
            >
              {entry.shapeLabel}
            </span>
            <span className="food-legend__info">
              <span className="food-legend__op">{entry.name}</span>
              <span className="food-legend__symbol">{entry.operation}</span>
              <span className="food-legend__value-hint">
                {entry.hasValue ? "value: 0xNN" : "no value"}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
