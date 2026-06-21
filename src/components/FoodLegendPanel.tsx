import { FOOD_LEGEND } from "@/engine/bitwise/FoodLegend";

/**
 * FoodLegendPanel：右侧果子图鉴侧边栏（todo.md 要求）。
 *
 * 只标注「形状/颜色 ↔ 运算类型」的对应关系，不展示具体数值——
 * 数值是游戏内随机生成的（2 位 16 进制），图鉴只需要让玩家认得
 * "这个颜色的果子是哪种位运算"，shift 类果子额外标注"无数值"。
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
