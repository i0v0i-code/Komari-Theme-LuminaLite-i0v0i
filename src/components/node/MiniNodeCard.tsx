import { memo, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  CircleDollarSign,
  Cpu,
  Gauge,
  HardDrive,
  MemoryStick,
} from "@/components/ui/icons";
import { clsx } from "clsx";
import { Flag } from "@/components/ui/Flag";
import { OsLogo } from "@/components/ui/OsLogo";
import { AnimatedValue } from "@/components/ui/AnimatedValue";
import { IpStackBadges } from "./IpStackBadges";
import { PingTaskRows } from "./PingTaskRows";
import { NodeHistoryStrip } from "./NodeHistoryStrip";
import { attentionAttrs } from "@/utils/nodeAttention";
import { AttentionReasons } from "./AttentionReasons";
import { useNodeCardModel, type NodePingSeries } from "@/hooks/useNodeCardModel";
import { useNodeStatusFlash } from "@/hooks/useNodeStatusFlash";
import { usePreferences } from "@/hooks/usePreferences";
import { useCanvasRedrawKey } from "@/hooks/useMetricColors";
import { speedRateColor } from "@/utils/metricTone";
import {
  clamp01,
  compactPercentText,
  joinTagTitle,
  nodeDetailLinkLabels,
} from "./nodeCardShared";
import { formatBytes, type ByteRateDisplay } from "@/utils/format";
import type { NodeInfo, NodeMetrics } from "@/types/komari";
import type { NodeHistory } from "@/utils/nodeHistory";

// 迷你卡固定为巡检布局，不跟随紧凑卡的可选指标开关；数据仍走共享模型。
const HEALTH_BAR_COUNT = 24;

type MiniNode = NodeInfo & NodeMetrics;
type MiniTag = { label: string; color: string };

function MiniHeader({
  node,
  osName,
  isOffline,
  lastSeen,
}: {
  node: MiniNode;
  osName: string;
  isOffline: boolean;
  lastSeen: string | null;
}) {
  const detailLabels = nodeDetailLinkLabels(node.name, osName, {
    offline: isOffline,
    lastSeen,
  });
  const detailHref = `/instance/${encodeURIComponent(node.uuid)}`;
  return (
    <header className="mini-node-header">
      <Flag region={node.region} size={14} />
      <Link
        to={detailHref}
        className="mini-node-title"
        title={node.name}
        aria-label={`${node.name}${isOffline ? "，离线" : ""}`}
      >
        {node.name}
      </Link>
      <Link
        to={detailHref}
        className="mini-node-os"
        title={detailLabels.title}
        aria-label={detailLabels.ariaLabel}
      >
        <OsLogo value={node.os} size={14} />
      </Link>
    </header>
  );
}

// 价格保底 chip 排最前；标签放不下时整枚隐藏，完整列表保留在 tooltip。
function MiniChips({
  tags,
  renewalPrice,
  ipv4,
  ipv6,
}: {
  tags: MiniTag[];
  renewalPrice: string | null;
  ipv4?: string | null;
  ipv6?: string | null;
}) {
  if (!renewalPrice && tags.length === 0 && !ipv4 && !ipv6) return null;
  const tagTitle = joinTagTitle(tags);
  return (
    <div className="mini-node-chip-row">
      {renewalPrice && (
        <span className="mini-node-price-tag" title={`续费价格 ${renewalPrice}`}>
          <CircleDollarSign size={11} strokeWidth={2.2} />
          {renewalPrice}
        </span>
      )}
      <IpStackBadges ipv4={ipv4} ipv6={ipv6} />
      {tags.length > 0 && (
        <div className="mini-node-tag-lane" title={tagTitle}>
          {tags.map((tag, index) => (
            <span key={`${tag.label}-${index}`} className="mini-node-tag" data-tag={tag.color}>
              {tag.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

type MiniMetricStyle = CSSProperties & {
  "--mini-metric-fill": string;
  "--mini-metric-color": string;
};

function MiniMetricBar({
  icon,
  label,
  valueText,
  unit,
  fraction,
  paint,
}: {
  icon: ReactNode;
  label: string;
  valueText: string;
  unit?: string;
  fraction: number;
  paint: string;
}) {
  const clamped = clamp01(fraction);
  const fullValue = `${valueText}${unit ?? ""}`;
  const style: MiniMetricStyle = {
    "--mini-metric-fill": `${clamped * 100}%`,
    "--mini-metric-color": paint,
  };

  return (
    <div className="metric-item mini-metric-item">
      <div className="mini-metric-head">
        <span className="mini-metric-label">
          {icon}
          {label}
        </span>
        <span className="mini-metric-value tabular" title={`${label} ${fullValue}`}>
          <strong><AnimatedValue text={valueText} /></strong>
          {unit && <small>{unit}</small>}
        </span>
      </div>
      <span className="mini-metric-track" style={style} aria-hidden />
    </div>
  );
}

function MiniVitals({
  node,
  loadFraction,
}: {
  node: MiniNode;
  loadFraction: number;
}) {
  return (
    <div className="mini-node-vitals">
      <MiniMetricBar
        icon={<Cpu size={12} strokeWidth={2} />}
        label="CPU"
        valueText={compactPercentText(node.cpuPct)}
        unit="%"
        fraction={node.cpuPct / 100}
        paint="var(--progress-cpu)"
      />
      <MiniMetricBar
        icon={<MemoryStick size={12} strokeWidth={2} />}
        label="内存"
        valueText={compactPercentText(node.ramPct)}
        unit="%"
        fraction={node.ramPct / 100}
        paint="var(--progress-memory)"
      />
      <MiniMetricBar
        icon={<HardDrive size={12} strokeWidth={2} />}
        label="磁盘"
        valueText={compactPercentText(node.diskPct)}
        unit="%"
        fraction={node.diskPct / 100}
        paint="var(--progress-disk)"
      />
      <MiniMetricBar
        icon={<Gauge size={12} strokeWidth={2} />}
        label="负载"
        valueText={node.load1.toFixed(2)}
        fraction={loadFraction}
        paint="var(--progress-load)"
      />
    </div>
  );
}

function MiniFlowRow({
  icon,
  value,
  unit,
  color,
  title,
}: {
  icon: ReactNode;
  value: string;
  unit?: string;
  color?: string;
  title: string;
}) {
  return (
    <span
      className="mini-node-flow-row"
      style={color ? { color } : undefined}
      title={title}
      aria-label={`${title} ${value}${unit ?? ""}`}
    >
      <span className="mini-node-flow-arrow">{icon}</span>
      <strong className="tabular">
        <AnimatedValue text={value} />
        {unit && <small>{unit}</small>}
      </strong>
    </span>
  );
}

// 左栏集中显示实时速率，右栏集中显示累计流量；每栏均按上行、下行排列。
function MiniFlow({
  node,
  upRate,
  downRate,
}: {
  node: MiniNode;
  upRate: ByteRateDisplay;
  downRate: ByteRateDisplay;
}) {
  return (
    <div className="mini-node-flow">
      <div className="mini-node-flow-group" aria-label="实时网速">
        <MiniFlowRow
          icon={<ArrowUp size={12} strokeWidth={2.4} />}
          value={upRate.value}
          unit={upRate.unit}
          color={speedRateColor(upRate.unit)}
          title="实时上行"
        />
        <MiniFlowRow
          icon={<ArrowDown size={12} strokeWidth={2.4} />}
          value={downRate.value}
          unit={downRate.unit}
          color={speedRateColor(downRate.unit)}
          title="实时下行"
        />
      </div>
      <div className="mini-node-flow-group" aria-label="累计流量">
        <MiniFlowRow
          icon={<ArrowUp size={12} strokeWidth={2.2} />}
          value={formatBytes(node.trafficUp)}
          title="累计上行"
        />
        <MiniFlowRow
          icon={<ArrowDown size={12} strokeWidth={2.2} />}
          value={formatBytes(node.trafficDown)}
          title="累计下行"
        />
      </div>
    </div>
  );
}

const MiniHealth = memo(function MiniHealth({
  pingSeries, hasHomepagePingBinding, history, redrawKey,
}: {
  pingSeries: NodePingSeries[];
  hasHomepagePingBinding: boolean;
  history: NodeHistory;
  redrawKey: string;
}) {
  return (
    <div className="mini-node-tail">
      {hasHomepagePingBinding && <PingTaskRows series={pingSeries} size="small" redrawKey={redrawKey} />}
      <NodeHistoryStrip history={history} redrawKey={redrawKey} height={14} />
    </div>
  );
});

export const MiniNodeCard = memo(function MiniNodeCard({ uuid }: { uuid: string }) {
  const { resolvedAppearance } = usePreferences();
  const redrawKey = useCanvasRedrawKey();
  const model = useNodeCardModel(uuid, HEALTH_BAR_COUNT);
  const statusFlash = useNodeStatusFlash(
    model.node ? model.node.online : null,
    model.attention,
  );

  if (!model.node) {
    return (
      <article className="mini-node-card skeleton-mini" aria-busy>
        <div className="skeleton-mini-header">
          <span className="skeleton-block" style={{ width: 14, height: 14, borderRadius: 3 }} />
          <span className="skeleton-block" style={{ width: "55%", height: 14 }} />
          <span className="skeleton-block" style={{ width: 14, height: 14, borderRadius: 3 }} />
        </div>
        <div className="skeleton-mini-chips">
          <span className="skeleton-block" style={{ width: 48, height: 20, borderRadius: 7 }} />
          <span className="skeleton-block" style={{ width: 36, height: 20, borderRadius: 7 }} />
        </div>
        <div className="skeleton-mini-vitals">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="skeleton-mini-gauge">
              <span className="skeleton-block" style={{ width: "70%", height: 10 }} />
              <span className="skeleton-block" style={{ width: "100%", height: 6, borderRadius: 3 }} />
            </div>
          ))}
        </div>
        <div className="skeleton-mini-flow">
          <span className="skeleton-block" style={{ width: "40%", height: 11 }} />
          <span className="skeleton-block" style={{ width: "40%", height: 11 }} />
        </div>
        <div className="skeleton-mini-health">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="skeleton-mini-health-item">
              <span className="skeleton-block" style={{ width: "60%", height: 10 }} />
              <span className="skeleton-block" style={{ width: "100%", height: 12, borderRadius: 3 }} />
            </div>
          ))}
        </div>
      </article>
    );
  }

  const {
    node,
    pingSeries,
    footerTags,
    renewalPrice,
    loadFraction,
    upRate,
    downRate,
    hasHomepagePingBinding,
    isOffline,
    osName,
    attention,
    history,
  } = model;

  return (
    // content-enter 只挂 article:骨架换成真实内容时 article 首次挂载,淡入一次;
    // 之后实时刷新不重建 article,不会重播。
    <article
      className={clsx("mini-node-card content-enter", isOffline && "is-offline", statusFlash.className)}
      onAnimationEnd={statusFlash.onAnimationEnd}
      data-appearance={resolvedAppearance}
      {...attentionAttrs(attention)}
    >
      <MiniHeader
        node={node}
        osName={osName}
        isOffline={isOffline}
        lastSeen={model.lastSeen}
      />
      <AttentionReasons attention={attention} />
      <MiniChips tags={footerTags} renewalPrice={renewalPrice} ipv4={node.ipv4} ipv6={node.ipv6} />
      <MiniVitals node={node} loadFraction={loadFraction} />
      <MiniFlow node={node} upRate={upRate} downRate={downRate} />
      {(hasHomepagePingBinding || history.slots.length > 0) && (
        <MiniHealth
          pingSeries={pingSeries}
          hasHomepagePingBinding={hasHomepagePingBinding}
          history={history}
          redrawKey={redrawKey}
        />
      )}
    </article>
  );
});
