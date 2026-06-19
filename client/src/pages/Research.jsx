import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Beaker, TrendingUp, AlertTriangle, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Research({ data, history }) {
  // Use history data if available, else mock some trend data
  const trendData = history && history.length > 0 
    ? history 
    : Array.from({ length: 20 }).map((_, i) => ({
        timestamp: new Date(Date.now() - (20 - i) * 60000).toLocaleTimeString(),
        anomalyScore: Math.max(0, 5 + Math.sin(i / 2) * 15 + (Math.random() * 5 - 2.5)),
        temperature: 32 + Math.sin(i / 3) * 5
      }));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="stagger"
    >
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Beaker color="var(--blue)" />
            AI Research & Analytics
          </h1>
          <p className="page-sub">Deep dive into predictive maintenance and historical trends</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="stat-label" style={{ color: 'var(--amber)' }}>Predicted Lifespan</div>
            <TrendingUp size={20} color="var(--amber)" />
          </div>
          <div className="stat-value">94.2<span style={{ fontSize: '16px', color: 'var(--text-3)' }}>%</span></div>
          <div className="stat-sub">Based on current degradation rate</div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="stat-label" style={{ color: 'var(--purple)' }}>Risk Probability</div>
            <AlertTriangle size={20} color="var(--purple)" />
          </div>
          <div className="stat-value">Low</div>
          <div className="stat-sub">Next 72 hours prediction</div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="stat-label" style={{ color: 'var(--blue)' }}>Energy Efficiency</div>
            <Zap size={20} color="var(--blue)" />
          </div>
          <div className="stat-value">98.5<span style={{ fontSize: '16px', color: 'var(--text-3)' }}>%</span></div>
          <div className="stat-sub">Optimal operation</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Anomaly Score vs Temperature Trend</h2>
        </div>
        <div className="card-body" style={{ height: '350px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="timestamp" stroke="var(--text-4)" fontSize={12} tickMargin={10} />
              <YAxis yAxisId="left" stroke="var(--text-4)" fontSize={12} tickFormatter={(val) => `${val}%`} />
              <YAxis yAxisId="right" orientation="right" stroke="var(--text-4)" fontSize={12} tickFormatter={(val) => `${val}°C`} />
              <Tooltip 
                contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }}
                itemStyle={{ color: 'var(--text-2)' }}
              />
              <Line yAxisId="left" type="monotone" dataKey="anomalyScore" name="Anomaly Score" stroke="var(--red)" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
              <Line yAxisId="right" type="monotone" dataKey="temperature" name="Temperature" stroke="var(--amber)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Research Insights</h2>
        </div>
        <div className="card-body">
          <ul style={{ paddingLeft: '20px', color: 'var(--text-2)', lineHeight: '1.8' }}>
            <li><strong>Thermal Stability:</strong> The pack maintains optimal temperature boundaries. No significant hotspots detected.</li>
            <li><strong>Cell Balancing:</strong> Minor drift observed in Cell 3 during peak discharge. Recommendation: Schedule active balancing cycle.</li>
            <li><strong>Gas Evolution:</strong> VOC levels are consistently below 150ppm. No outgassing events predicted.</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
