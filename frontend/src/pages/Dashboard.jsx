import { useFetch } from '../hooks'
import { dashboardApi } from '../api'
import { Skeleton, EmptyState } from '../components/ui'
import { STAGE_COLORS } from '../utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, CartesianGrid,
} from 'recharts'

const STAGE_ORDER = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED']

export default function Dashboard() {
  const { data, loading } = useFetch(() => dashboardApi.getMetrics(), [])

  const statCards = data ? [
    { label: 'Total Candidates', value: data.totalCandidates, sub: 'in the system' },
    { label: 'Hires This Month', value: data.hiresThisMonth, sub: 'moved to hired' },
    { label: 'Avg Time to Hire', value: `${data.avgTimeToHireDays}d`, sub: 'application to hire' },
    { label: 'Offers Pending', value: data.countByStage.OFFER || 0, sub: 'awaiting decision' },
  ] : []

  const stageBarData = data
    ? STAGE_ORDER.map(s => ({ name: s, count: data.countByStage[s] || 0, fill: STAGE_COLORS[s] }))
    : []

  const sourceData = data
    ? Object.entries(data.topSources || {}).map(([name, value]) => ({ name, value }))
    : []

  const COLORS = ['#4f8ef7', '#f59e0b', '#a855f7', '#14b8a6', '#22c55e', '#ef4444']

  const lineData = data?.last30Days || []

  const jobBarData = data
    ? Object.entries(data.applicationsByJob || {}).map(([name, count]) => ({ name, count }))
    : []

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Hiring pipeline overview</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="stat-grid">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={100} style={{ borderRadius: 16 }} />)
          : statCards.map(s => (
              <div key={s.label} className="stat-card">
                <div className="label">{s.label}</div>
                <div className="value">{s.value}</div>
                <div className="sub">{s.sub}</div>
              </div>
            ))
        }
      </div>

      {/* Stage counts as mini cards row */}
      {!loading && data && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          {STAGE_ORDER.map(s => (
            <div key={s} style={{
              flex: '1 1 120px',
              background: 'var(--card)',
              border: `1px solid ${STAGE_COLORS[s]}40`,
              borderRadius: 10,
              padding: '12px 16px',
            }}>
              <div style={{ fontSize: '0.7rem', color: STAGE_COLORS[s], fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{s}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{data.countByStage[s] || 0}</div>
              {data.funnelConversion[s] != null && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 2 }}>{data.funnelConversion[s]}% reached</div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="charts-grid">
        {/* Applications over 30 days */}
        <div className="chart-card chart-full">
          <h3>Applications – Last 30 Days</h3>
          {loading ? <Skeleton height={180} /> : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={lineData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3350" />
                <XAxis dataKey="date" tick={{ fill: '#5a6a8a', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fill: '#5a6a8a', fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#1a2033', border: '1px solid #2a3350', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#8899be' }}
                  itemStyle={{ color: '#4f8ef7' }}
                />
                <Line type="monotone" dataKey="count" stroke="#4f8ef7" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Stage bar chart */}
        <div className="chart-card">
          <h3>Candidates by Stage</h3>
          {loading ? <Skeleton height={220} /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stageBarData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3350" />
                <XAxis dataKey="name" tick={{ fill: '#5a6a8a', fontSize: 10 }} />
                <YAxis tick={{ fill: '#5a6a8a', fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#1a2033', border: '1px solid #2a3350', borderRadius: 8, fontSize: 12 }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {stageBarData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Source pie chart */}
        <div className="chart-card">
          <h3>Top Sources</h3>
          {loading ? <Skeleton height={220} /> : !sourceData.length ? <EmptyState message="No source data" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11, color: '#8899be' }} />
                <Tooltip
                  contentStyle={{ background: '#1a2033', border: '1px solid #2a3350', borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Applications per job */}
        {jobBarData.length > 0 && (
          <div className="chart-card chart-full">
            <h3>Applications per Job</h3>
            {loading ? <Skeleton height={180} /> : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={jobBarData} layout="vertical" margin={{ top: 4, right: 20, left: 110, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a3350" />
                  <XAxis type="number" tick={{ fill: '#5a6a8a', fontSize: 10 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#8899be', fontSize: 10 }} width={110} />
                  <Tooltip
                    contentStyle={{ background: '#1a2033', border: '1px solid #2a3350', borderRadius: 8, fontSize: 12 }}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  />
                  <Bar dataKey="count" fill="#4f8ef7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
