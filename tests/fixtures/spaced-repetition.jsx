import { useState } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadialBarChart,
  RadialBar,
} from "recharts";

const forgettingData = [
  { time: "0h", noReview: 100, withSR: 100 },
  { time: "1h", noReview: 58, withSR: 100 },
  { time: "6h", noReview: 44, withSR: 95 },
  { time: "1d", noReview: 33, withSR: 85 },
  { time: "2d", noReview: 28, withSR: 72 },
  { time: "3d", noReview: 25, withSR: 90 },
  { time: "6d", noReview: 21, withSR: 78 },
  { time: "1w", noReview: 18, withSR: 92 },
  { time: "2w", noReview: 15, withSR: 82 },
  { time: "3w", noReview: 12, withSR: 93 },
  { time: "1m", noReview: 10, withSR: 88 },
  { time: "2m", noReview: 8, withSR: 94 },
];

const intervalData = [
  { review: "1st", days: 1, label: "1 day" },
  { review: "2nd", days: 3, label: "3 days" },
  { review: "3rd", days: 7, label: "1 week" },
  { review: "4th", days: 16, label: "16 days" },
  { review: "5th", days: 35, label: "35 days" },
  { review: "6th", days: 70, label: "70 days" },
];

const scheduleData = [
  { week: "Wk 1-4", newProblems: 70, review: 30, label: "Foundation" },
  { week: "Wk 5-8", newProblems: 50, review: 50, label: "Patterns" },
  { week: "Wk 9-12", newProblems: 30, review: 70, label: "Intensify" },
  { week: "Wk 13", newProblems: 0, review: 100, label: "Final" },
];

const retentionComparison = [
  { name: "Brute Force\n(200+ problems)", value: 30, fill: "#ef4444" },
  { name: "With SR\n(80 problems)", value: 85, fill: "#22c55e" },
];

const dailyBreakdown = [
  { activity: "Anki Review", minutes: 25, color: "#f59e0b" },
  { activity: "New Problem", minutes: 45, color: "#3b82f6" },
  { activity: "Re-solve", minutes: 30, color: "#8b5cf6" },
  { activity: "Sys Design", minutes: 20, color: "#ec4899" },
];

const tabs = [
  { id: "forgetting", label: "Forgetting Curve" },
  { id: "intervals", label: "Review Intervals" },
  { id: "schedule", label: "12-Week Plan" },
  { id: "retention", label: "Retention Impact" },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "rgba(15, 15, 20, 0.95)",
        border: "1px solid rgba(245, 158, 11, 0.3)",
        borderRadius: 8,
        padding: "10px 14px",
        backdropFilter: "blur(12px)",
      }}
    >
      <p
        style={{
          color: "#fbbf24",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          margin: 0,
          marginBottom: 6,
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>
      {payload.map((p, i) => (
        <p
          key={i}
          style={{
            color: p.color || p.stroke || "#fff",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            margin: "3px 0",
          }}
        >
          {p.name}: <strong>{p.value}%</strong>
        </p>
      ))}
    </div>
  );
};

const BarTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div
      style={{
        background: "rgba(15, 15, 20, 0.95)",
        border: "1px solid rgba(245, 158, 11, 0.3)",
        borderRadius: 8,
        padding: "10px 14px",
        backdropFilter: "blur(12px)",
      }}
    >
      <p
        style={{
          color: "#fbbf24",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          margin: 0,
        }}
      >
        Review #{d?.review?.replace(/\D/g, "")} — {d?.label}
      </p>
    </div>
  );
};

export default function SpacedRepetitionDashboard() {
  const [activeTab, setActiveTab] = useState("forgetting");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(145deg, #0a0a0f 0%, #0f0f1a 40%, #0a0f14 100%)",
        color: "#e5e5e5",
        fontFamily: "'Outfit', 'Segoe UI', sans-serif",
        padding: "32px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
        rel="stylesheet"
      />

      {/* Ambient glow */}
      <div
        style={{
          position: "fixed",
          top: -200,
          right: -200,
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: -300,
          left: -100,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div style={{ maxWidth: 880, margin: "0 auto", position: "relative" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 6,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#f59e0b",
              boxShadow: "0 0 12px rgba(245,158,11,0.6)",
            }}
          />
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: 3,
              color: "#f59e0b",
              textTransform: "uppercase",
            }}
          >
            Interview Prep Analytics
          </span>
        </div>

        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 42px)",
            fontWeight: 800,
            lineHeight: 1.1,
            margin: "8px 0 10px",
            background: "linear-gradient(135deg, #fefefe 20%, #fbbf24 80%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: -1,
          }}
        >
          Spaced Repetition
        </h1>
        <p
          style={{
            fontSize: 15,
            color: "#888",
            maxWidth: 520,
            lineHeight: 1.5,
            margin: "0 0 32px",
          }}
        >
          The science of turning fragile short-term memory into durable
          long-term knowledge for DSA interviews
        </p>

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 28,
            background: "rgba(255,255,255,0.03)",
            borderRadius: 12,
            padding: 4,
            border: "1px solid rgba(255,255,255,0.06)",
            overflowX: "auto",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: "10px 8px",
                border: "none",
                borderRadius: 9,
                cursor: "pointer",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "clamp(10px, 1.5vw, 12px)",
                fontWeight: activeTab === tab.id ? 600 : 400,
                letterSpacing: 0.5,
                background:
                  activeTab === tab.id
                    ? "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.08))"
                    : "transparent",
                color: activeTab === tab.id ? "#fbbf24" : "#666",
                transition: "all 0.25s ease",
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Chart Panels */}
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            padding: "28px 20px 20px",
            minHeight: 400,
          }}
        >
          {activeTab === "forgetting" && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    margin: "0 0 6px",
                    color: "#f0f0f0",
                  }}
                >
                  The Ebbinghaus Forgetting Curve
                </h2>
                <p style={{ fontSize: 13, color: "#777", margin: 0, lineHeight: 1.5 }}>
                  Without review, you lose ~90% in a week. Spaced repetition
                  keeps retention above 85% indefinitely by timing reviews right
                  before you forget.
                </p>
              </div>
              <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 24,
                      height: 3,
                      borderRadius: 2,
                      background: "#ef4444",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      color: "#999",
                    }}
                  >
                    No Review
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 24,
                      height: 3,
                      borderRadius: 2,
                      background: "#22c55e",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      color: "#999",
                    }}
                  >
                    With Spaced Repetition
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={forgettingData}>
                  <defs>
                    <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.04)"
                  />
                  <XAxis
                    dataKey="time"
                    stroke="#444"
                    tick={{ fill: "#666", fontSize: 11, fontFamily: "'JetBrains Mono'" }}
                    axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                  />
                  <YAxis
                    stroke="#444"
                    tick={{ fill: "#666", fontSize: 11, fontFamily: "'JetBrains Mono'" }}
                    axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                    domain={[0, 105]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="noReview"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    fill="url(#redGrad)"
                    name="No Review"
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: "#ef4444", fill: "#0f0f1a" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="withSR"
                    stroke="#22c55e"
                    strokeWidth={2.5}
                    fill="url(#greenGrad)"
                    name="With SR"
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: "#22c55e", fill: "#0f0f1a" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeTab === "intervals" && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    margin: "0 0 6px",
                    color: "#f0f0f0",
                  }}
                >
                  Expanding Review Intervals (SM-2)
                </h2>
                <p style={{ fontSize: 13, color: "#777", margin: 0, lineHeight: 1.5 }}>
                  Each successful recall pushes the next review further out.
                  After 6 reviews, a concept you first learned today won't need
                  review for over 2 months.
                </p>
              </div>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={intervalData} barSize={40}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                      <stop offset="100%" stopColor="#d97706" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.04)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="review"
                    stroke="#444"
                    tick={{ fill: "#999", fontSize: 12, fontFamily: "'JetBrains Mono'" }}
                    axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                  />
                  <YAxis
                    stroke="#444"
                    tick={{ fill: "#666", fontSize: 11, fontFamily: "'JetBrains Mono'" }}
                    axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                    tickFormatter={(v) => `${v}d`}
                  />
                  <Tooltip content={<BarTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="days" radius={[6, 6, 0, 0]}>
                    {intervalData.map((_, i) => (
                      <Cell
                        key={i}
                        fill="url(#barGrad)"
                        style={{
                          filter: `brightness(${1 + i * 0.06})`,
                        }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 6,
                  marginTop: 12,
                  flexWrap: "wrap",
                }}
              >
                {intervalData.map((d, i) => (
                  <div
                    key={i}
                    style={{
                      background: "rgba(245,158,11,0.08)",
                      border: "1px solid rgba(245,158,11,0.15)",
                      borderRadius: 8,
                      padding: "6px 12px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono'",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#fbbf24",
                      }}
                    >
                      {d.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "schedule" && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    margin: "0 0 6px",
                    color: "#f0f0f0",
                  }}
                >
                  12-Week Prep Schedule
                </h2>
                <p style={{ fontSize: 13, color: "#777", margin: 0, lineHeight: 1.5 }}>
                  Gradually shift from learning new material to reviewing. Stop
                  adding new cards entirely in the final week.
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  marginBottom: 16,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 3,
                      background: "#3b82f6",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono'",
                      fontSize: 11,
                      color: "#999",
                    }}
                  >
                    New Material
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 3,
                      background: "#22c55e",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono'",
                      fontSize: 11,
                      color: "#999",
                    }}
                  >
                    Spaced Review
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scheduleData} barSize={32}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.04)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="week"
                    stroke="#444"
                    tick={{ fill: "#999", fontSize: 11, fontFamily: "'JetBrains Mono'" }}
                    axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                  />
                  <YAxis
                    stroke="#444"
                    tick={{ fill: "#666", fontSize: 11, fontFamily: "'JetBrains Mono'" }}
                    axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0]?.payload;
                      return (
                        <div
                          style={{
                            background: "rgba(15,15,20,0.95)",
                            border: "1px solid rgba(245,158,11,0.3)",
                            borderRadius: 8,
                            padding: "10px 14px",
                          }}
                        >
                          <p
                            style={{
                              color: "#fbbf24",
                              fontFamily: "'JetBrains Mono'",
                              fontSize: 12,
                              margin: "0 0 4px",
                              fontWeight: 600,
                            }}
                          >
                            {d.label} Phase
                          </p>
                          <p
                            style={{
                              color: "#3b82f6",
                              fontFamily: "'JetBrains Mono'",
                              fontSize: 12,
                              margin: "2px 0",
                            }}
                          >
                            New: {d.newProblems}%
                          </p>
                          <p
                            style={{
                              color: "#22c55e",
                              fontFamily: "'JetBrains Mono'",
                              fontSize: 12,
                              margin: "2px 0",
                            }}
                          >
                            Review: {d.review}%
                          </p>
                        </div>
                      );
                    }}
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  />
                  <Bar
                    dataKey="newProblems"
                    stackId="a"
                    fill="#3b82f6"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="review"
                    stackId="a"
                    fill="#22c55e"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>

              {/* Daily breakdown */}
              <div
                style={{
                  marginTop: 24,
                  padding: "16px 20px",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <p
                  style={{
                    fontFamily: "'JetBrains Mono'",
                    fontSize: 11,
                    letterSpacing: 2,
                    color: "#777",
                    textTransform: "uppercase",
                    margin: "0 0 12px",
                  }}
                >
                  Daily Time Breakdown (~2 hrs)
                </p>
                <div style={{ display: "flex", gap: 3, borderRadius: 6, overflow: "hidden" }}>
                  {dailyBreakdown.map((d, i) => (
                    <div
                      key={i}
                      style={{
                        flex: d.minutes,
                        height: 32,
                        background: d.color,
                        opacity: 0.8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono'",
                          fontSize: 10,
                          color: "#000",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          padding: "0 4px",
                        }}
                      >
                        {d.minutes}m
                      </span>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 10,
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  {dailyBreakdown.map((d, i) => (
                    <div
                      key={i}
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: d.color,
                        }}
                      />
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono'",
                          fontSize: 10,
                          color: "#888",
                        }}
                      >
                        {d.activity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "retention" && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    margin: "0 0 6px",
                    color: "#f0f0f0",
                  }}
                >
                  Retention: Brute Force vs Spaced Repetition
                </h2>
                <p style={{ fontSize: 13, color: "#777", margin: 0, lineHeight: 1.5 }}>
                  Fewer problems with spaced review beats grinding through
                  hundreds. Quality of practice trumps volume.
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "clamp(16px, 4vw, 48px)",
                  alignItems: "center",
                  minHeight: 320,
                  flexWrap: "wrap",
                }}
              >
                {retentionComparison.map((item, i) => (
                  <div key={i} style={{ textAlign: "center" }}>
                    <div
                      style={{
                        position: "relative",
                        width: 180,
                        height: 180,
                      }}
                    >
                      {/* Background ring */}
                      <svg
                        viewBox="0 0 180 180"
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                        }}
                      >
                        <circle
                          cx="90"
                          cy="90"
                          r="72"
                          fill="none"
                          stroke="rgba(255,255,255,0.05)"
                          strokeWidth="14"
                        />
                        <circle
                          cx="90"
                          cy="90"
                          r="72"
                          fill="none"
                          stroke={item.fill}
                          strokeWidth="14"
                          strokeLinecap="round"
                          strokeDasharray={`${(item.value / 100) * 452.4} 452.4`}
                          strokeDashoffset="0"
                          transform="rotate(-90 90 90)"
                          style={{
                            filter: `drop-shadow(0 0 8px ${item.fill}44)`,
                            transition: "stroke-dasharray 0.8s ease",
                          }}
                        />
                      </svg>
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            fontFamily: "'Outfit'",
                            fontSize: 42,
                            fontWeight: 800,
                            color: item.fill,
                            lineHeight: 1,
                          }}
                        >
                          {item.value}%
                        </div>
                        <div
                          style={{
                            fontFamily: "'JetBrains Mono'",
                            fontSize: 10,
                            color: "#777",
                            marginTop: 4,
                          }}
                        >
                          retention
                        </div>
                      </div>
                    </div>
                    <p
                      style={{
                        fontFamily: "'JetBrains Mono'",
                        fontSize: 12,
                        color: "#bbb",
                        marginTop: 16,
                        lineHeight: 1.5,
                        whiteSpace: "pre-line",
                      }}
                    >
                      {item.name}
                    </p>
                  </div>
                ))}
              </div>

              {/* Key stats row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: 12,
                  marginTop: 24,
                }}
              >
                {[
                  { label: "Optimal new cards/day", value: "3-5", accent: "#f59e0b" },
                  { label: "Daily review time", value: "15-30m", accent: "#3b82f6" },
                  { label: "Stop new cards before interview", value: "1 week", accent: "#22c55e" },
                  { label: "Recall boost from spacing", value: "+150%", accent: "#ec4899" },
                ].map((s, i) => (
                  <div
                    key={i}
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 10,
                      padding: "14px 16px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Outfit'",
                        fontSize: 22,
                        fontWeight: 700,
                        color: s.accent,
                      }}
                    >
                      {s.value}
                    </div>
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono'",
                        fontSize: 10,
                        color: "#777",
                        marginTop: 4,
                        lineHeight: 1.4,
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p
          style={{
            textAlign: "center",
            fontFamily: "'JetBrains Mono'",
            fontSize: 10,
            color: "#444",
            marginTop: 24,
            letterSpacing: 1,
          }}
        >
          Data synthesized from Ebbinghaus (1885), Cepeda et al. (2006), SM-2
          algorithm specs, and practitioner reports
        </p>
      </div>
    </div>
  );
}