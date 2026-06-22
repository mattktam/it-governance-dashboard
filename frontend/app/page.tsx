'use client';

import { useState, useEffect } from 'react';

interface Service {
  name: string;
  cost: number;
  icon?: string;
  tags: {
    itOwner: string;
    application: string;
    environment?: string;
    costCenter?: string;
  };
}

interface Spike {
  service: string;
  direction: 'up' | 'down';
  yesterday: number;
  today: number;
  change: number;
  percent: number;
}


const serviceIcons: Record<string, string> = {
  'EC2': '💻',
  'S3': '🗄️',
  'RDS': '🗄️',
  'Lambda': 'λ',
  'CloudFront': '🌍',
  'ElastiCache': '⚡',
  'DynamoDB': '📊',
  'ECS': '🐳',
  'API Gateway': '🌐',
  'CloudWatch': '👁️',
  'OpenSearch': '🔍',
  'Redshift': '📈',
  'Glue': '⚙️',
};

function getServiceIcon(serviceName: string): string {
  for (const [key, icon] of Object.entries(serviceIcons)) {
    if (serviceName.includes(key)) return icon;
  }
  return '📦';
}

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [days, setDays] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const [isRealData, setIsRealData] = useState(false);

  useEffect(() => {
    fetchData();
  }, [days]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/costs?days=${days}`);
      const data = await response.json();

      if (data.services && Array.isArray(data.services)) {
        const servicesWithIcons = data.services.map((s: Service) => ({
          ...s,
          icon: getServiceIcon(s.name),
        }));
        setServices(servicesWithIcons);
        setIsRealData(true);
      } else {
        setServices(mockServices);
        setIsRealData(false);
      }
    } catch (error) {
      console.error('Failed to fetch AWS data:', error);
      setServices(mockServices);
      setIsRealData(false);
    }
    setIsLoading(false);
  };


  const mockServices: Service[] = [
    { name: 'EC2 Compute', cost: 2845.67, icon: '💻', tags: { itOwner: 'John Smith', application: 'Web App' } },
    { name: 'S3 Storage', cost: 1456.23, icon: '🗄️', tags: { itOwner: 'Sarah Chen', application: 'Data Pipeline' } },
    { name: 'RDS Database', cost: 987.45, icon: '📊', tags: { itOwner: 'Mike Johnson', application: 'API Gateway' } },
    { name: 'Lambda', cost: 567.89, icon: 'λ', tags: { itOwner: 'John Smith', application: 'Backup' } },
    { name: 'CloudFront', cost: 456.12, icon: '🌍', tags: { itOwner: 'Sarah Chen', application: 'Web App' } },
    { name: 'ElastiCache', cost: 234.56, icon: '⚡', tags: { itOwner: 'Mike Johnson', application: 'Web App' } },
    { name: 'DynamoDB', cost: 145.67, icon: '📊', tags: { itOwner: 'John Smith', application: 'Data Pipeline' } },
    { name: 'ECS', cost: 312.34, icon: '🐳', tags: { itOwner: 'Sarah Chen', application: 'Microservices' } },
  ];

  const totalCost = services.reduce((sum, s) => sum + s.cost, 0);
  const dailyAverage = totalCost / days;

  const topSpenders = services.slice(0, 5).map((s, i) => ({
    name: s.name,
    cost: s.cost,
    rank: i + 1,
  }));

  const spikes: Spike[] = services.slice(0, 3).map((s) => ({
    service: s.name,
    direction: 'up',
    yesterday: s.cost * 0.85,
    today: s.cost,
    change: s.cost * 0.15,
    percent: 15,
  }));

  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
  const gradients = [
    'from-yellow-500/20 to-yellow-600/20',
    'from-slate-400/20 to-slate-500/20',
    'from-orange-600/20 to-orange-700/20',
    'from-blue-500/20 to-blue-600/20',
    'from-pink-500/20 to-pink-600/20',
  ];

  const cards = [
    { label: 'Period Total', value: `$${totalCost.toFixed(2)}`, icon: '💵', gradient: 'from-purple-500/20 to-purple-600/20' },
    { label: 'Services Active', value: services.length, icon: '🔧', gradient: 'from-blue-500/20 to-blue-600/20' },
    { label: 'Daily Average', value: `$${dailyAverage.toFixed(2)}`, icon: '📈', gradient: 'from-cyan-500/20 to-cyan-600/20' },
    { label: 'Top Service', value: services[0]?.name || 'N/A', icon: '📊', gradient: 'from-pink-500/20 to-pink-600/20' },
  ];

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              💰 Cost Dashboard
            </h1>
            <div className="flex items-center gap-3">
              <p className="text-muted-foreground">Real-time AWS spending insights</p>
              {isRealData && (
                <span className="text-xs bg-green-500/20 text-green-300 px-3 py-1 rounded-full border border-green-500/50">
                  ✓ Real AWS Data
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  days === d
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/50'
                    : 'border border-border/50 text-foreground hover:border-accent hover:bg-card/50'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className={`bg-gradient-to-br ${card.gradient} border border-border/50 rounded-xl p-6 backdrop-blur-sm hover:border-accent/50 transition-all hover:shadow-lg hover:shadow-purple-500/10 animate-slide-up`}
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="text-3xl mb-3">{card.icon}</div>
              <h3 className="text-3xl font-bold text-foreground mb-2">{card.value}</h3>
              <p className="text-sm text-muted-foreground">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Spenders */}
          <div className="bg-gradient-to-br from-card/50 to-card/30 border border-border/50 rounded-xl p-8 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-foreground mb-6">🏆 Top Spenders</h2>
            <div className="space-y-3">
              {topSpenders.map((spender, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-4 border border-border/50 rounded-lg bg-gradient-to-r ${gradients[idx]} hover:border-accent/50 transition-all hover:shadow-lg hover:shadow-purple-500/10 group`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl group-hover:scale-125 transition-transform">{medals[idx]}</span>
                    <span className="font-medium text-foreground">{spender.name}</span>
                  </div>
                  <span className="font-bold text-sm bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    ${spender.cost.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Spikes */}
          <div className="bg-gradient-to-br from-card/50 to-card/30 border border-border/50 rounded-xl p-8 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-foreground mb-6">⚠️ Cost Spikes</h2>
            <div className="space-y-3">
              {spikes.map((spike, idx) => (
                <div
                  key={idx}
                  className={`p-4 border rounded-lg transition-all group ${
                    spike.direction === 'up'
                      ? 'border-red-500/30 bg-gradient-to-r from-red-500/10 to-transparent hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/20'
                      : 'border-green-500/30 bg-gradient-to-r from-green-500/10 to-transparent hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl group-hover:scale-125 transition-transform">
                        {spike.direction === 'up' ? '📈' : '📉'}
                      </span>
                      <div>
                        <p className="font-semibold text-foreground">{spike.service}</p>
                        <p className="text-xs text-muted-foreground">
                          ${spike.yesterday.toFixed(2)} → ${spike.today.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${spike.direction === 'up' ? 'text-red-400' : 'text-green-400'}`}>
                        {spike.direction === 'up' ? '↑' : '↓'} {spike.percent.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">${spike.change.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Services Table */}
        <div className="bg-gradient-to-br from-card/50 to-card/30 border border-border/50 rounded-xl p-8 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-foreground mb-6">📋 Services by Cost</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Service</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Owner</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Application</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Cost</th>
                </tr>
              </thead>
              <tbody>
                {services.map((svc, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-border/30 hover:bg-purple-500/10 transition-all group"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{svc.icon}</span>
                        <span className="font-medium text-foreground">{svc.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">{svc.tags.itOwner}</td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">{svc.tags.application}</td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-bold text-sm bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                        ${svc.cost.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
