"use client";
import { Model, OVERALL } from "../lib/types";
import { sortedProps } from "../lib/parse";
import { fmt, scoreInk } from "../lib/score";

export default function Overview({ model }: { model: Model }) {
  const par = model.scaleMax / 2;

  // 1. Strongest partnership
  const ranked = sortedProps(model, OVERALL);
  const top = ranked[0];
  const topScore = model.roll[OVERALL][top];

  // Objective averages across all properties
  const objAvg = model.objOrder.map((o) => {
    const vs = model.props.map((p) => model.roll[o][p]).filter((v): v is number => typeof v === "number");
    return { o, avg: vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : null };
  });
  const withVals = objAvg.filter((x) => x.avg != null) as { o: string; avg: number }[];
  const strongestObj = withVals.slice().sort((a, b) => b.avg - a.avg)[0];
  const weakestObj = withVals.slice().sort((a, b) => a.avg - b.avg)[0];

  // 4. Above benchmark
  const scored = model.props.map((p) => model.roll[OVERALL][p]).filter((v): v is number => typeof v === "number");
  const abovePar = scored.filter((v) => v > par).length;

  return (
    <section>
      <p className="ov-headline">
        A read on the portfolio at a glance. {model.props.length} properties scored across {model.objOrder.length} objectives, benchmarked against par of {fmt(par)}.
      </p>

      <div className="ov-grid">
        <div className="ov-card">
          <span className="ov-tag">Top ranked</span>
          <span className="v" style={{ color: scoreInk(topScore, model.scaleMax) }}>{top}</span>
          <span className="d">Highest overall at {fmt(topScore)} out of {model.scaleMax}.</span>
        </div>

        <div className="ov-card">
          <span className="k">Portfolio strength</span>
          <span className="v" style={{ color: strongestObj ? scoreInk(strongestObj.avg, model.scaleMax) : undefined }}>
            {strongestObj ? strongestObj.o : "–"}
          </span>
          <span className="d">Strongest objective, averaging {strongestObj ? fmt(strongestObj.avg) : "–"} across the portfolio.</span>
        </div>

        <div className="ov-card">
          <span className="k">Biggest gap</span>
          <span className="v" style={{ color: weakestObj ? scoreInk(weakestObj.avg, model.scaleMax) : undefined }}>
            {weakestObj ? weakestObj.o : "–"}
          </span>
          <span className="d">Weakest objective, averaging {weakestObj ? fmt(weakestObj.avg) : "–"}. The clearest place to focus.</span>
        </div>

        <div className="ov-card">
          <span className="k">Above benchmark</span>
          <span className="v">{abovePar}<span className="v-sub"> / {model.props.length}</span></span>
          <span className="d">Properties scoring above par ({fmt(par)}) overall.</span>
        </div>
      </div>
    </section>
  );
}
