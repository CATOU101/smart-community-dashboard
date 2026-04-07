let completionChart;
let budgetChart;
let statusChart;
let severityChart;

const chartRegistry = () => [completionChart, budgetChart, statusChart, severityChart];

const emptyStatePlugin = {
  id: 'emptyState',
  afterDraw(chart, _args, pluginOptions) {
    if (!pluginOptions?.enabled) return;

    const datasets = chart.data?.datasets || [];
    const hasData = datasets.some((dataset) => (dataset.data || []).some((value) => Number(value) > 0));
    if (hasData) return;

    const { ctx, chartArea } = chart;
    if (!chartArea) return;

    ctx.save();
    ctx.fillStyle = pluginOptions.color;
    ctx.font = `${pluginOptions.fontWeight} ${pluginOptions.fontSize}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      pluginOptions.message || 'No data available',
      (chartArea.left + chartArea.right) / 2,
      (chartArea.top + chartArea.bottom) / 2
    );
    ctx.restore();
  }
};

const getCssVar = (name, fallback) =>
  getComputedStyle(document.body).getPropertyValue(name).trim() || fallback;

const palette = () => ({
  primary: '#2563EB',
  secondary: '#10B981',
  accent: '#F59E0B',
  danger: '#EF4444',
  neutral: '#6B7280',
  text: getCssVar('--text', '#111111'),
  muted: getCssVar('--text-muted', '#555555'),
  grid: 'rgba(148, 163, 184, 0.22)'
});

const withAlpha = (hex, alpha) => {
  const normalized = hex.replace('#', '');
  const bigint = Number.parseInt(normalized, 16);
  const red = (bigint >> 16) & 255;
  const green = (bigint >> 8) & 255;
  const blue = bigint & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const destroyCharts = () => {
  chartRegistry().forEach((chart) => chart?.destroy());
};

const baseLegend = (colors) => ({
  position: 'top',
  labels: {
    color: colors.muted,
    usePointStyle: true,
    boxWidth: 10,
    boxHeight: 10,
    padding: 16,
    font: {
      size: 11,
      weight: '600'
    }
  }
});

const tooltipCallbacks = (formatter) => ({
  title(context) {
    const label = context[0]?.label || 'Item';
    return `Insight: ${label}`;
  },
  label(context) {
    return formatter(context);
  }
});

const buildCommonOptions = (colors, { indexAxis = 'x', empty = false, formatter }) => ({
  responsive: true,
  maintainAspectRatio: false,
  resizeDelay: 120,
  interaction: {
    mode: 'nearest',
    intersect: false
  },
  layout: {
    padding: {
      top: 8,
      right: 12,
      bottom: 8,
      left: 8
    }
  },
  animation: {
    duration: 1000,
    easing: 'easeOutQuart'
  },
  hover: {
    animationDuration: 220
  },
  plugins: {
    legend: baseLegend(colors),
    tooltip: {
      backgroundColor: '#0f172a',
      titleColor: '#f8fafc',
      bodyColor: '#e2e8f0',
      cornerRadius: 10,
      padding: 12,
      displayColors: true,
      callbacks: tooltipCallbacks(formatter)
    },
    emptyState: {
      enabled: empty,
      color: colors.muted,
      fontSize: 14,
      fontWeight: '600',
      message: 'No data available'
    }
  },
  scales: {
    x: {
      display: indexAxis !== 'y',
      ticks: {
        color: colors.muted,
        font: {
          size: 11
        }
      },
      grid: {
        color: colors.grid,
        drawBorder: false
      },
      border: {
        display: false
      }
    },
    y: {
      display: indexAxis !== 'x',
      ticks: {
        color: colors.muted,
        font: {
          size: 11
        }
      },
      grid: {
        color: colors.grid,
        drawBorder: false
      },
      border: {
        display: false
      }
    }
  }
});

const buildBarOptions = (colors, formatter) => {
  const options = buildCommonOptions(colors, { formatter });
  options.scales.y = {
    ...options.scales.y,
    min: 0,
    max: 100
  };
  return options;
};

const buildPieOptions = (colors, formatter, empty = false) => ({
  responsive: true,
  maintainAspectRatio: false,
  resizeDelay: 120,
  layout: {
    padding: 12
  },
  animation: {
    duration: 1000,
    easing: 'easeOutQuart'
  },
  hover: {
    animationDuration: 220
  },
  plugins: {
    legend: baseLegend(colors),
    tooltip: {
      backgroundColor: '#0f172a',
      titleColor: '#f8fafc',
      bodyColor: '#e2e8f0',
      cornerRadius: 10,
      padding: 12,
      callbacks: tooltipCallbacks(formatter)
    },
    emptyState: {
      enabled: empty,
      color: colors.muted,
      fontSize: 14,
      fontWeight: '600',
      message: 'No data available'
    }
  }
});

const buildBarDataset = (label, data, color, hoverColor) => ({
  label,
  data,
  backgroundColor: data.map(() => withAlpha(color, 0.82)),
  hoverBackgroundColor: data.map(() => withAlpha(hoverColor, 0.98)),
  borderColor: data.map(() => color),
  borderWidth: 0,
  borderRadius: 10,
  borderSkipped: false,
  maxBarThickness: 34,
  hoverBorderRadius: 14,
  clip: false
});

const buildPieDataset = (values, colors) => ({
  data: values,
  backgroundColor: colors.map((color) => withAlpha(color, 0.88)),
  hoverBackgroundColor: colors.map((color) => withAlpha(color, 1)),
  borderColor: getCssVar('--surface', '#ffffff'),
  borderWidth: 3,
  hoverOffset: 10,
  spacing: 2
});

// Shared chart rendering keeps styles, tooltips, legends, and empty states consistent.
export const renderCharts = (initiatives, issues = []) => {
  destroyCharts();

  const colors = palette();
  const labels = initiatives.map((item) => item.title);
  const completionData = initiatives.map((item) => item.progressPercentage);
  const budgetPercent = initiatives.map((item) =>
    item.budget > 0 ? Number(((item.budgetUsed / item.budget) * 100).toFixed(2)) : 0
  );

  const statusCounts = initiatives.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    },
    { Pending: 0, Ongoing: 0, Completed: 0 }
  );

  const severityCounts = issues.reduce(
    (acc, item) => {
      const severity = item.severity || 'Medium';
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    },
    { Low: 0, Medium: 0, High: 0, Critical: 0 }
  );

  completionChart = new Chart(document.getElementById('completionChart'), {
    type: 'bar',
    plugins: [emptyStatePlugin],
    data: {
      labels,
      datasets: [buildBarDataset('Completion %', completionData, colors.primary, colors.accent)]
    },
    options: buildBarOptions(colors, (context) => `${context.label}: ${context.parsed.y}%`)
  });

  budgetChart = new Chart(document.getElementById('budgetChart'), {
    type: 'bar',
    plugins: [emptyStatePlugin],
    data: {
      labels,
      datasets: [buildBarDataset('Budget Used %', budgetPercent, colors.secondary, colors.primary)]
    },
    options: buildBarOptions(colors, (context) => `${context.label}: ${context.parsed.y}% used`)
  });

  statusChart = new Chart(document.getElementById('statusChart'), {
    type: 'doughnut',
    plugins: [emptyStatePlugin],
    data: {
      labels: ['Pending', 'Ongoing', 'Completed'],
      datasets: [
        buildPieDataset(
          [statusCounts.Pending, statusCounts.Ongoing, statusCounts.Completed],
          [colors.neutral, colors.primary, colors.secondary]
        )
      ]
    },
    options: buildPieOptions(colors, (context) => `${context.label}: ${context.parsed} initiatives`, true)
  });

  severityChart = new Chart(document.getElementById('severityChart'), {
    type: 'doughnut',
    plugins: [emptyStatePlugin],
    data: {
      labels: ['Low', 'Medium', 'High', 'Critical'],
      datasets: [
        buildPieDataset(
          [severityCounts.Low, severityCounts.Medium, severityCounts.High, severityCounts.Critical],
          [colors.neutral, colors.primary, colors.accent, colors.danger]
        )
      ]
    },
    options: buildPieOptions(colors, (context) => `${context.label}: ${context.parsed} issues`, true)
  });
};

// Reusable export for future charts if more dashboard analytics are added.
export const chartOptions = {
  emptyStatePlugin,
  buildCommonOptions,
  buildBarOptions,
  buildPieOptions
};
