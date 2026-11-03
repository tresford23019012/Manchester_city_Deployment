import type { ReactNode } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { DashboardData } from "../../../models/services/w3/types";

const tick = { fill: "var(--w3-muted)", fontSize: 12 };
const tooltipStyle = {
  background: "var(--w3-surface)",
  border: "1px solid var(--w3-border)",
  borderRadius: 6,
  color: "var(--w3-text)",
  fontSize: 13,
};

const shortDate = (name: string) => name;

function ChartCard(props: {
  title: string;
  description: string;
  empty: boolean;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <figure className={`w3-card w3-chartcard${props.wide ? " w3-chartcard--wide" : ""}`}>
      <figcaption>
        <h2 className="w3-card__label">{props.title}</h2>
        <p className="w3-card__hint">{props.description}</p>
      </figcaption>
      <div className="w3-chart">
        {props.empty ? <p className="w3-chart__empty">No data yet</p> : props.children}
      </div>
    </figure>
  );
}

export function Charts({ data }: { data: DashboardData }) {
  const { mostViewed, topFavourited, statusBreakdown } = data;

  const statusData = [
    { name: "Published", value: statusBreakdown.published, color: "var(--w3-published)" },
    { name: "Draft", value: statusBreakdown.draft, color: "var(--w3-draft)" },
    { name: "Suspended", value: statusBreakdown.suspended, color: "var(--w3-suspended)" },
  ];
  const statusTotal = statusData.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="w3-charts">
      <ChartCard
        wide
        title="Most viewed guesthouses"
        description="Total page views by guesthouse"
        empty={mostViewed.length === 0}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mostViewed} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
            <CartesianGrid stroke="var(--w3-border)" vertical={false} />
            <XAxis dataKey="name" tickFormatter={shortDate} tick={tick} tickLine={false} axisLine={false} minTickGap={24} />
            <YAxis tick={tick} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={(l) => shortDate(String(l))} />
            <Line type="monotone" dataKey="views" name="Views" stroke="var(--w3-accent)" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Most favourited"
        description="Top guesthouses saved by guests"
        empty={topFavourited.length === 0}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={topFavourited} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
            <CartesianGrid stroke="var(--w3-border)" horizontal={false} />
            <XAxis type="number" tick={tick} tickLine={false} axisLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={110} tick={tick} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--w3-border)", opacity: 0.4 }} />
            <Bar dataKey="favourites" name="Favourites" fill="var(--w3-accent-2)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Listing status"
        description="Published, draft and suspended listings"
        empty={statusTotal === 0}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={statusData} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={2} stroke="none">
              {statusData.map((s) => (
                <Cell key={s.name} fill={s.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 13, color: "var(--w3-text)" }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

export function ChartsSkeleton() {
  return (
    <div className="w3-charts" aria-hidden="true">
      {[true, false, false].map((wide, i) => (
        <div className={`w3-card w3-chartcard${wide ? " w3-chartcard--wide" : ""}`} key={i}>
          <div className="w3-skel" style={{ width: "40%", height: 14 }} />
          <div className="w3-skel" style={{ width: "100%", height: 220, marginTop: 16 }} />
        </div>
      ))}
    </div>
  );
}