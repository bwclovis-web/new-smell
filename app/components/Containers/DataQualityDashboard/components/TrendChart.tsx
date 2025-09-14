import { Line } from 'react-chartjs-2'

interface TrendChartProps {
  trendChartData: any
}

const TrendChart: React.FC<TrendChartProps> = ({ trendChartData }) => (
  <div className="bg-gray-50 rounded-lg p-4 mb-8">
    <h3 className="text-lg font-medium text-gray-800 mb-4">Data Quality Trends</h3>
    <Line
      options={{
        responsive: true,
        plugins: {
          legend: {
            position: 'top' as const,
          },
          title: {
            display: true,
            text: 'Quality Trends Over Time',
          },
        },
      }}
      data={trendChartData}
    />
  </div>
)

export default TrendChart
