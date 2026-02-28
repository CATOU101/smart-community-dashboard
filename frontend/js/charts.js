let completionChart;
let budgetChart;
let statusChart;

const axisStyle = {
  ticks: { color: '#444444' },
  grid: { color: '#e5e5e5' }
};

const destroyCharts = () => {
  completionChart?.destroy();
  budgetChart?.destroy();
  statusChart?.destroy();
};

export const renderCharts = (initiatives) => {
  destroyCharts();

  const labels = initiatives.map((i) => i.title);
  const completionData = initiatives.map((i) => i.progressPercentage);
  const budgetPercent = initiatives.map((i) =>
    i.budget > 0 ? Number(((i.budgetUsed / i.budget) * 100).toFixed(2)) : 0
  );

  const statusCounts = initiatives.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    },
    { Pending: 0, Ongoing: 0, Completed: 0 }
  );

  completionChart = new Chart(document.getElementById('completionChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Completion %',
          data: completionData,
          backgroundColor: '#2563eb',
          borderRadius: 4
        }
      ]
    },
    options: { responsive: true, scales: { x: axisStyle, y: { ...axisStyle, min: 0, max: 100 } } }
  });

  budgetChart = new Chart(document.getElementById('budgetChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Budget Used %',
          data: budgetPercent,
          backgroundColor: '#2563eb',
          borderRadius: 4
        }
      ]
    },
    options: { responsive: true, scales: { x: axisStyle, y: { ...axisStyle, min: 0, max: 100 } } }
  });

  statusChart = new Chart(document.getElementById('statusChart'), {
    type: 'pie',
    data: {
      labels: ['Pending', 'Ongoing', 'Completed'],
      datasets: [
        {
          data: [statusCounts.Pending, statusCounts.Ongoing, statusCounts.Completed],
          backgroundColor: ['#9ca3af', '#2563eb', '#16a34a']
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: { color: '#444444' }
        }
      }
    }
  });
};
