import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EMPTY_PING } from "@/hooks/usePingOverview";
import type { NodePingSeries } from "@/hooks/useNodeCardModel";
import { metricText, PingTaskRows } from "../PingTaskRows";

function target(taskId: number, taskName: string, lastValue: number | null, loss: number | null): NodePingSeries {
  return { taskId, label: "", ping: { ...EMPTY_PING, taskId, taskName, lastValue, loss }, buckets: [], latencyColor: "green", lossColor: "green" };
}
const render = (series: NodePingSeries[]) => renderToStaticMarkup(createElement(PingTaskRows, { series }));

describe("PingTaskRows", () => {
  it("keeps zero as a real reading", () => {
    expect(metricText(0, "ms")).toBe("0ms");
    expect(metricText(0, "%")).toBe("0.0%");
  });
  it("uses unknown text for missing, negative, and non-finite readings", () => {
    for (const value of [null, undefined, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(metricText(value, "ms")).toBe("无样本");
      expect(metricText(value, "%")).toBe("无样本");
    }
  });
  it("renders every monitor with its own readings and two trends, not selectable tabs", () => {
    const html = render([target(1, "福建联通", 173, 0), target(2, "福建移动", 163, 2.5), target(3, "福建电信", 169, 100)]);
    expect(html.match(/role="listitem"/g)).toHaveLength(3);
    expect(html.match(/role="group"/g)).toHaveLength(6);
    for (const summary of ["福建联通 · 延迟 173ms · 丢包 0.0%", "福建移动 · 延迟 163ms · 丢包 2.5%", "福建电信 · 延迟 169ms · 丢包 100.0%"]) expect(html).toContain(summary);
    expect(html).not.toContain('role="tab"');
    expect(html).toContain("监测节点");
  });
  it("preserves the actual single-task name and full long name hint", () => {
    const name = "福建福州联通长名称监测节点";
    const html = render([target(1, name, null, null)]);
    expect(html.match(/role="listitem"/g)).toHaveLength(1);
    expect(html).toContain(`title="${name}"`);
    expect(html).toContain("延迟 无样本 · 丢包 无样本");
    expect(html).not.toContain("0.0%");
  });
  it("renders nothing when no tasks exist", () => expect(render([])).toBe(""));
});
