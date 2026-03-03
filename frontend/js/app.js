import { api } from './api.js';
import { renderCharts } from './charts.js';

const state = {
  user: null,
  initiatives: [],
  issueRequests: [],
  myIssues: [],
  searchTerm: '',
  statusFilter: '',
  map: null,
  mapMarkersLayer: null,
  issueMap: null,
  issueMapMarker: null
};

const byId = (id) => document.getElementById(id);

const elements = {
  authSection: byId('authSection'),
  dashboardSection: byId('dashboardSection'),
  initiativesSection: byId('initiativesSection'),
  initiativeFormSection: byId('initiativeFormSection'),
  issueSubmitSection: byId('issueSubmitSection'),
  myRequestsSection: byId('myRequestsSection'),
  adminIssueSection: byId('adminIssueSection'),
  feedbackSection: byId('feedbackSection'),
  adminFeedbackSection: byId('adminFeedbackSection'),
  initiativesList: byId('initiativesList'),
  initiativesTableBody: byId('initiativesTableBody'),
  feedbackList: byId('feedbackList'),
  myRequestsList: byId('myRequestsList'),
  adminIssueTableBody: byId('adminIssueTableBody'),
  issueDetailsPane: byId('issueDetailsPane'),
  feedbackInitiative: byId('feedbackInitiative'),
  statsCards: byId('statsCards'),
  toast: byId('toast'),
  roleBadge: byId('roleBadge'),
  profileName: byId('profileName'),
  globalSearch: byId('globalSearch'),
  statusFilter: byId('statusFilter'),
  goInitiativesBtn: byId('goInitiativesBtn'),
  goFeedbackBtn: byId('goFeedbackBtn'),
  openAddInitiativeBtn: byId('openAddInitiativeBtn'),
  backToInitiativesBtn: byId('backToInitiativesBtn'),
  welcomeText: byId('welcomeText'),
  logoutBtn: byId('logoutBtn'),
  initiativeFormTitle: byId('initiativeFormTitle'),
  cancelEditBtn: byId('cancelEditBtn'),
  initiativeFormCard: byId('initiativeFormCard')
};

const showToast = (message) => {
  elements.toast.textContent = message;
  elements.toast.classList.remove('hidden');
  setTimeout(() => elements.toast.classList.add('hidden'), 2500);
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read selected image'));
    reader.readAsDataURL(file);
  });

const setActiveSection = (sectionId) => {
  document.querySelectorAll('.section').forEach((section) => {
    section.classList.remove('active');
    section.classList.add('hidden');
  });

  const target = byId(sectionId);
  target.classList.remove('hidden');
  target.classList.add('active');

  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.section === sectionId);
  });

  if (sectionId === 'dashboardSection' && state.map) {
    setTimeout(() => state.map.invalidateSize(), 120);
  }

  if (sectionId === 'issueSubmitSection') {
    initIssueLocationMap();
    setTimeout(() => state.issueMap?.invalidateSize(), 120);
  }
};

const isAdmin = () => state.user?.role === 'admin';

const formatDate = (value) => new Date(value).toLocaleDateString();
const statusClass = (value = '') => value.toLowerCase().replace(/\s+/g, '-');

const validateInitiativeForm = (payload) => {
  if (new Date(payload.endDate) < new Date(payload.startDate)) {
    throw new Error('End date cannot be earlier than start date');
  }

  if (Number(payload.budgetUsed) > Number(payload.budget)) {
    throw new Error('Budget used cannot exceed total budget');
  }

  if ((payload.latitude && !payload.longitude) || (!payload.latitude && payload.longitude)) {
    throw new Error('Both latitude and longitude are required together');
  }
};

const createMapIcon = () =>
  L.divIcon({
    className: '',
    html: '<span class="custom-map-marker"></span>',
    iconSize: [24, 30],
    iconAnchor: [12, 30],
    popupAnchor: [0, -28]
  });

const initMap = () => {
  if (state.map || typeof L === 'undefined') return;

  state.map = L.map('initiativesMap').setView([22.5726, 88.3639], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(state.map);
  state.mapMarkersLayer = L.layerGroup().addTo(state.map);
};

const initIssueLocationMap = () => {
  if (state.issueMap || typeof L === 'undefined') return;

  state.issueMap = L.map('issueLocationMap').setView([22.5726, 88.3639], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(state.issueMap);

  state.issueMap.on('click', (event) => {
    const { lat, lng } = event.latlng;
    byId('issueLatitude').value = lat.toFixed(6);
    byId('issueLongitude').value = lng.toFixed(6);

    if (state.issueMapMarker) {
      state.issueMapMarker.setLatLng([lat, lng]);
      return;
    }

    state.issueMapMarker = L.marker([lat, lng]).addTo(state.issueMap);
  });
};

const renderMapMarkers = (initiativesWithCoords) => {
  initMap();
  if (!state.map || !state.mapMarkersLayer) return;

  state.mapMarkersLayer.clearLayers();

  const validPoints = initiativesWithCoords.filter(
    (item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude)
  );

  if (!validPoints.length) {
    state.map.setView([22.5726, 88.3639], 12);
    return;
  }

  validPoints.forEach((item) => {
    const marker = L.marker([item.latitude, item.longitude], { icon: createMapIcon() });
    marker.bindPopup(`
      <strong>${item.title}</strong><br/>
      Progress: ${item.progressPercentage}%<br/>
      Status: ${item.status}<br/>
      <a href="#" class="map-popup-link" data-initiative-id="${item._id}">Go to Initiative</a>
    `);
    marker.addTo(state.mapMarkersLayer);
  });

  const first = validPoints[0];
  state.map.setView([first.latitude, first.longitude], 12);
};

const getFilteredInitiatives = () => {
  const term = state.searchTerm.trim().toLowerCase();
  return state.initiatives.filter((initiative) => {
    const matchesSearch =
      !term ||
      [initiative.title, initiative.location, initiative.status, initiative.description]
        .join(' ')
        .toLowerCase()
        .includes(term);
    const matchesStatus = !state.statusFilter || initiative.status === state.statusFilter;
    return matchesSearch && matchesStatus;
  });
};

const renderStats = (items) => {
  const total = items.length;
  const completed = items.filter((i) => i.status === 'Completed').length;
  const ongoing = items.filter((i) => i.status === 'Ongoing').length;
  const pending = items.filter((i) => i.status === 'Pending').length;
  const totalBudget = items.reduce((sum, item) => sum + item.budget, 0);

  elements.statsCards.innerHTML = `
    <div class="stat-box"><strong>${total}</strong><div>Total Initiatives</div></div>
    <div class="stat-box"><strong>${completed}</strong><div>Completed</div></div>
    <div class="stat-box"><strong>${ongoing}</strong><div>Ongoing</div></div>
    <div class="stat-box"><strong>${pending}</strong><div>Pending</div></div>
    <div class="stat-box"><strong>INR ${totalBudget.toLocaleString()}</strong><div>Total Budget</div></div>
  `;
};

const renderFeedbackDropdown = () => {
  elements.feedbackInitiative.innerHTML = state.initiatives
    .map((item) => `<option value="${item._id}">${item.title}</option>`)
    .join('');
};

const renderInitiatives = (filtered) => {
  elements.initiativesTableBody.innerHTML = '';

  if (!filtered.length) {
    elements.initiativesTableBody.innerHTML = `
      <tr>
        <td colspan="7">No initiatives found.</td>
      </tr>
    `;
    return;
  }

  filtered.forEach((initiative) => {
    const budgetPercent = initiative.budget
      ? ((initiative.budgetUsed / initiative.budget) * 100).toFixed(1)
      : 0;
    const remaining = initiative.budget - initiative.budgetUsed;
    const remainingClass = remaining < 0 ? 'negative' : 'positive';
    const actions = isAdmin()
      ? `
        <button data-action="edit" data-id="${initiative._id}">Edit</button>
        <button class="danger-btn" data-action="delete" data-id="${initiative._id}">Delete</button>
      `
      : '-';

    const row = document.createElement('tr');
    row.dataset.initiativeId = initiative._id;
    row.innerHTML = `
      <td>
        <strong>${initiative.title}</strong>
        <div class="hint">${initiative.description}</div>
      </td>
      <td>${initiative.location}</td>
      <td><span class="status ${initiative.status.toLowerCase()}">${initiative.status}</span></td>
      <td>
        <div class="progress-track">
          <div class="progress-bar" style="width:${initiative.progressPercentage}%"></div>
        </div>
        ${initiative.progressPercentage}%
      </td>
      <td>
        INR ${initiative.budget.toLocaleString()}<br />
        <span class="hint">Used: INR ${initiative.budgetUsed.toLocaleString()} (${budgetPercent}%)</span><br />
        <span class="${remainingClass}">Remaining: INR ${remaining.toLocaleString()}</span>
      </td>
      <td>${formatDate(initiative.startDate)} - ${formatDate(initiative.endDate)}</td>
      <td class="${isAdmin() ? '' : 'hidden'}">
        <div class="item-actions">${actions}</div>
      </td>
    `;
    elements.initiativesTableBody.appendChild(row);
  });
};

const focusInitiativeRow = (initiativeId) => {
  const row = document.querySelector(`tr[data-initiative-id="${initiativeId}"]`);
  if (!row) return;

  document.querySelectorAll('.row-focus').forEach((el) => el.classList.remove('row-focus'));
  row.classList.add('row-focus');
  row.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

const renderAdminFeedback = async () => {
  if (!isAdmin()) return;

  const feedbackList = await api.getAllFeedback();
  elements.feedbackList.innerHTML = '';

  if (!feedbackList.length) {
    elements.feedbackList.innerHTML = '<p>No feedback submitted yet.</p>';
    return;
  }

  feedbackList.forEach((entry) => {
    const item = document.createElement('div');
    item.className = 'item';
    const deleteButton = isAdmin()
      ? `<div class="item-actions"><button class="danger-btn" data-feedback-id="${entry._id}">Delete</button></div>`
      : '';
    item.innerHTML = `
      <p><strong>Initiative:</strong> ${entry.initiative?.title || 'Unknown'}</p>
      <p><strong>User:</strong> ${entry.user?.name || 'Unknown'} (${entry.user?.email || 'n/a'})</p>
      <p>${entry.comment}</p>
      ${entry.imageData ? `<img src="${entry.imageData}" class="feedback-image" alt="Feedback attachment" />` : ''}
      <small>${formatDate(entry.createdAt)}</small>
      ${deleteButton}
    `;
    elements.feedbackList.appendChild(item);
  });
};

const renderMyRequests = () => {
  elements.myRequestsList.innerHTML = '';

  if (!state.myIssues.length) {
    elements.myRequestsList.innerHTML = '<p>No issue requests submitted yet.</p>';
    return;
  }

  state.myIssues.forEach((issue) => {
    const item = document.createElement('div');
    item.className = 'item';
    const rejection = issue.status === 'Rejected' ? `<p><strong>Reason:</strong> ${issue.rejectionReason || 'N/A'}</p>` : '';
    const converted =
      issue.status === 'Converted' && issue.convertedInitiative?._id
        ? `<p><a href="#" class="initiative-link" data-initiative-id="${issue.convertedInitiative._id}">Converted to Initiative</a></p>`
        : '';
    item.innerHTML = `
      <p><strong>${issue.title}</strong></p>
      <p>${issue.description}</p>
      <p><strong>Category:</strong> ${issue.category}</p>
      <p><strong>Status:</strong> <span class="status ${statusClass(issue.status)}">${issue.status}</span></p>
      ${rejection}
      ${converted}
      <small>${formatDate(issue.createdAt)}</small>
    `;
    elements.myRequestsList.appendChild(item);
  });
};

const renderIssueDetails = (issue) => {
  const images = (issue.images || [])
    .map((src) => `<img src="${src}" class="feedback-image" alt="Issue attachment" />`)
    .join('');
  elements.issueDetailsPane.innerHTML = `
    <p><strong>${issue.title}</strong></p>
    <p>${issue.description}</p>
    <p><strong>Category:</strong> ${issue.category}</p>
    <p><strong>Coordinates:</strong> ${issue.latitude}, ${issue.longitude}</p>
    <p><strong>Status:</strong> <span class="status ${statusClass(issue.status)}">${issue.status}</span></p>
    <p><strong>Flagged:</strong> ${issue.flagged ? 'Yes' : 'No'}</p>
    ${issue.rejectionReason ? `<p><strong>Rejection Reason:</strong> ${issue.rejectionReason}</p>` : ''}
    ${images || '<p>No images attached.</p>'}
  `;
};

const renderAdminIssues = () => {
  elements.adminIssueTableBody.innerHTML = '';

  if (!state.issueRequests.length) {
    elements.adminIssueTableBody.innerHTML = `
      <tr><td colspan="7">No issue requests found.</td></tr>
    `;
    return;
  }

  state.issueRequests.forEach((issue) => {
    const row = document.createElement('tr');
    if (issue.status === 'Rejected') {
      row.classList.add('issue-row-rejected');
    } else if (issue.flagged) {
      row.classList.add('issue-row-flagged');
    }
    row.innerHTML = `
      <td>${issue.title}</td>
      <td>${issue.category}</td>
      <td>${issue.submittedBy?.name || 'Unknown'}</td>
      <td>${formatDate(issue.createdAt)}</td>
      <td><span class="status ${statusClass(issue.status)}">${issue.status}</span></td>
      <td><span class="flag-pill">${issue.flagged ? 'Yes' : 'No'}</span></td>
      <td>
        <div class="item-actions">
          <button data-issue-action="approve" data-issue-id="${issue._id}">Approve</button>
          <button class="secondary-btn" data-issue-action="reject" data-issue-id="${issue._id}">Reject</button>
          <button class="secondary-btn" data-issue-action="convert" data-issue-id="${issue._id}">Convert</button>
          <button class="secondary-btn" data-issue-action="details" data-issue-id="${issue._id}">View Details</button>
        </div>
      </td>
    `;
    elements.adminIssueTableBody.appendChild(row);
  });
};

const setAuthUI = () => {
  const adminOnly = document.querySelectorAll('.admin-only');
  const userOnly = document.querySelectorAll('.user-only');

  if (state.user) {
    elements.authSection.classList.add('hidden');
    elements.logoutBtn.classList.remove('hidden');
    elements.roleBadge.textContent = state.user.role.toUpperCase();
    elements.profileName.textContent = state.user.name;
    elements.welcomeText.textContent = `Welcome, ${state.user.name}`;
    setActiveSection('dashboardSection');
  } else {
    elements.authSection.classList.remove('hidden');
    elements.authSection.classList.add('active');
    elements.logoutBtn.classList.add('hidden');
    elements.roleBadge.textContent = 'Guest';
    elements.profileName.textContent = 'Guest User';
    elements.welcomeText.textContent = 'Please login to continue';
    setActiveSection('authSection');
  }

  adminOnly.forEach((el) => {
    el.classList.toggle('hidden', !isAdmin());
  });
  userOnly.forEach((el) => {
    el.classList.toggle('hidden', isAdmin());
  });

  elements.initiativeFormCard.classList.toggle('hidden', !isAdmin());
};

const clearInitiativeForm = () => {
  byId('initiativeId').value = '';
  byId('initiativeForm').reset();
  byId('budgetUsed').value = 0;
  elements.initiativeFormTitle.textContent = 'Add Initiative';
  elements.cancelEditBtn.classList.add('hidden');
};

const populateInitiativeForm = (item) => {
  byId('initiativeId').value = item._id;
  byId('title').value = item.title;
  byId('description').value = item.description;
  byId('location').value = item.location;
  byId('latitude').value = item.latitude ?? '';
  byId('longitude').value = item.longitude ?? '';
  byId('budget').value = item.budget;
  byId('budgetUsed').value = item.budgetUsed;
  byId('startDate').value = item.startDate.slice(0, 10);
  byId('endDate').value = item.endDate.slice(0, 10);
  byId('status').value = item.status;
  byId('progressPercentage').value = item.progressPercentage;
  elements.initiativeFormTitle.textContent = 'Edit Initiative';
  elements.cancelEditBtn.classList.remove('hidden');
};

const loadDashboard = async () => {
  state.initiatives = await api.getInitiatives();
  renderFeedbackDropdown();
  renderDashboardViews();
  if (isAdmin()) {
    state.issueRequests = await api.getIssues();
    renderAdminIssues();
  } else if (state.user) {
    state.myIssues = await api.getUserIssues();
    renderMyRequests();
  }
  await renderAdminFeedback();
};

const renderDashboardViews = () => {
  const filtered = getFilteredInitiatives();
  renderStats(filtered);
  renderInitiatives(filtered);
  renderCharts(filtered);
  renderMapMarkers(filtered);
};

const handleLogin = async (event) => {
  event.preventDefault();

  try {
    const payload = {
      email: byId('loginEmail').value.trim(),
      password: byId('loginPassword').value
    };

    const response = await api.login(payload);
    localStorage.setItem('token', response.token);
    state.user = response.user;
    setAuthUI();
    await loadDashboard();
    showToast('Login successful');
    event.target.reset();
  } catch (error) {
    showToast(error.message);
  }
};

const handleRegister = async (event) => {
  event.preventDefault();

  try {
    const payload = {
      name: byId('registerName').value.trim(),
      email: byId('registerEmail').value.trim(),
      password: byId('registerPassword').value
    };

    const response = await api.register(payload);
    localStorage.setItem('token', response.token);
    state.user = response.user;
    setAuthUI();
    await loadDashboard();
    showToast('Registration successful');
    event.target.reset();
  } catch (error) {
    showToast(error.message);
  }
};

const handleInitiativeSubmit = async (event) => {
  event.preventDefault();

  try {
    const payload = {
      title: byId('title').value.trim(),
      description: byId('description').value.trim(),
      location: byId('location').value.trim(),
      latitude: byId('latitude').value ? Number(byId('latitude').value) : undefined,
      longitude: byId('longitude').value ? Number(byId('longitude').value) : undefined,
      budget: Number(byId('budget').value),
      budgetUsed: Number(byId('budgetUsed').value),
      startDate: byId('startDate').value,
      endDate: byId('endDate').value,
      status: byId('status').value,
      progressPercentage: Number(byId('progressPercentage').value)
    };

    validateInitiativeForm(payload);

    const id = byId('initiativeId').value;
    if (id) {
      await api.updateInitiative(id, payload);
      showToast('Initiative updated');
    } else {
      await api.createInitiative(payload);
      showToast('Initiative added');
    }

    clearInitiativeForm();
    await loadDashboard();
    setActiveSection('initiativesSection');
  } catch (error) {
    showToast(error.message);
  }
};

const handleFeedbackSubmit = async (event) => {
  event.preventDefault();

  try {
    const imageFile = byId('feedbackImage')?.files?.[0];
    if (imageFile && imageFile.size > 2 * 1024 * 1024) {
      throw new Error('Image size must be 2MB or less');
    }

    const payload = {
      initiative: byId('feedbackInitiative').value,
      comment: byId('feedbackComment').value.trim(),
      imageData: imageFile ? await readFileAsDataUrl(imageFile) : undefined
    };

    await api.addFeedback(payload);
    event.target.reset();
    const preview = byId('feedbackImagePreview');
    preview.src = '';
    preview.classList.add('hidden');
    showToast('Feedback submitted successfully');
    await renderAdminFeedback();
  } catch (error) {
    showToast(error.message);
  }
};

const handleIssueSubmit = async (event) => {
  event.preventDefault();

  try {
    const lat = byId('issueLatitude').value;
    const lng = byId('issueLongitude').value;
    if (!lat || !lng) {
      throw new Error('Please click on the map to set issue location');
    }

    const files = Array.from(byId('issueImages')?.files || []);
    const images = [];
    for (const file of files) {
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('Each image must be 2MB or less');
      }
      images.push(await readFileAsDataUrl(file));
    }

    const payload = {
      title: byId('issueTitle').value.trim(),
      description: byId('issueDescription').value.trim(),
      category: byId('issueCategory').value,
      latitude: Number(lat),
      longitude: Number(lng),
      images
    };

    await api.createIssue(payload);
    event.target.reset();
    byId('issueLatitude').value = '';
    byId('issueLongitude').value = '';
    byId('issueImagePreview').innerHTML = '';
    if (state.issueMapMarker) {
      state.issueMap.removeLayer(state.issueMapMarker);
      state.issueMapMarker = null;
    }
    showToast('Issue request submitted');
    state.myIssues = await api.getUserIssues();
    renderMyRequests();
    setActiveSection('myRequestsSection');
  } catch (error) {
    showToast(error.message);
  }
};

const setupNav = () => {
  document.querySelectorAll('.nav-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!state.user && button.dataset.section !== 'authSection') {
        showToast('Please login first');
        return;
      }

      setActiveSection(button.dataset.section);
      if (button.dataset.section === 'adminFeedbackSection') {
        await renderAdminFeedback();
      }
      if (button.dataset.section === 'adminIssueSection' && isAdmin()) {
        state.issueRequests = await api.getIssues();
        renderAdminIssues();
      }
      if (button.dataset.section === 'myRequestsSection' && !isAdmin()) {
        state.myIssues = await api.getUserIssues();
        renderMyRequests();
      }
    });
  });
};

const setupTopActions = () => {
  elements.goInitiativesBtn?.addEventListener('click', () => setActiveSection('initiativesSection'));
  elements.goFeedbackBtn?.addEventListener('click', () =>
    setActiveSection(isAdmin() ? 'adminFeedbackSection' : 'feedbackSection')
  );
};

const setupSearch = () => {
  elements.globalSearch?.addEventListener('input', (event) => {
    state.searchTerm = event.target.value || '';
    renderDashboardViews();
  });

  elements.statusFilter?.addEventListener('change', (event) => {
    state.statusFilter = event.target.value || '';
    renderDashboardViews();
  });
};

const setupFeedbackActions = () => {
  elements.feedbackList.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-feedback-id]');
    if (!button || !isAdmin()) return;

    const confirmed = window.confirm('Delete this feedback entry?');
    if (!confirmed) return;

    try {
      await api.deleteFeedback(button.dataset.feedbackId);
      showToast('Feedback deleted');
      await renderAdminFeedback();
    } catch (error) {
      showToast(error.message);
    }
  });

  byId('feedbackImage')?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    const preview = byId('feedbackImagePreview');

    if (!file) {
      preview.src = '';
      preview.classList.add('hidden');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast('Image size must be 2MB or less');
      event.target.value = '';
      preview.src = '';
      preview.classList.add('hidden');
      return;
    }

    try {
      preview.src = await readFileAsDataUrl(file);
      preview.classList.remove('hidden');
    } catch (error) {
      showToast(error.message);
      event.target.value = '';
      preview.src = '';
      preview.classList.add('hidden');
    }
  });
};

const setupIssueActions = () => {
  byId('issueImages')?.addEventListener('change', async (event) => {
    const preview = byId('issueImagePreview');
    preview.innerHTML = '';

    const files = Array.from(event.target.files || []);
    for (const file of files) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Each image must be 2MB or less');
        event.target.value = '';
        preview.innerHTML = '';
        return;
      }

      try {
        const src = await readFileAsDataUrl(file);
        const img = document.createElement('img');
        img.src = src;
        img.alt = 'Issue upload preview';
        preview.appendChild(img);
      } catch (error) {
        showToast(error.message);
      }
    }
  });

  elements.adminIssueTableBody?.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-issue-action]');
    if (!button || !isAdmin()) return;

    const action = button.dataset.issueAction;
    const issueId = button.dataset.issueId;
    const issue = state.issueRequests.find((row) => row._id === issueId);
    if (!issue) return;

    try {
      if (action === 'details') {
        renderIssueDetails(issue);
        return;
      }

      if (action === 'approve') {
        await api.updateIssue(issueId, { status: 'Approved' });
        showToast('Issue approved');
      } else if (action === 'reject') {
        const reason = window.prompt('Enter rejection reason');
        if (!reason) return;
        await api.updateIssue(issueId, { status: 'Rejected', rejectionReason: reason });
        showToast('Issue rejected');
      } else if (action === 'convert') {
        await api.convertIssue(issueId);
        showToast('Issue converted to initiative');
        await loadDashboard();
        return;
      }

      state.issueRequests = await api.getIssues();
      renderAdminIssues();
    } catch (error) {
      showToast(error.message);
    }
  });
};

const setupInitiativeActions = () => {
  elements.initiativesList.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button || !isAdmin()) return;

    const { action, id } = button.dataset;
    const item = state.initiatives.find((initiative) => initiative._id === id);

    if (action === 'edit' && item) {
      populateInitiativeForm(item);
      setActiveSection('initiativeFormSection');
      return;
    }

    if (action === 'delete' && id) {
      const confirmed = window.confirm('Are you sure you want to delete this initiative?');
      if (!confirmed) return;

      try {
        await api.deleteInitiative(id);
        showToast('Initiative deleted');
        await loadDashboard();
      } catch (error) {
        showToast(error.message);
      }
    }
  });
};

const setupInitiativeFormNavigation = () => {
  elements.openAddInitiativeBtn?.addEventListener('click', () => {
    clearInitiativeForm();
    setActiveSection('initiativeFormSection');
  });

  elements.backToInitiativesBtn?.addEventListener('click', () => {
    clearInitiativeForm();
    setActiveSection('initiativesSection');
  });
};

const setupMapActions = () => {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('.map-popup-link, .initiative-link');
    if (!link) return;

    event.preventDefault();
    const initiativeId = link.dataset.initiativeId;
    if (!initiativeId) return;

    setActiveSection('initiativesSection');
    setTimeout(() => focusInitiativeRow(initiativeId), 80);
  });
};

const logout = () => {
  localStorage.removeItem('token');
  state.user = null;
  state.initiatives = [];
  state.issueRequests = [];
  state.myIssues = [];
  setAuthUI();
};

const boot = async () => {
  setupNav();
  setupInitiativeActions();
  setupInitiativeFormNavigation();
  setupTopActions();
  setupSearch();
  setupFeedbackActions();
  setupIssueActions();
  setupMapActions();

  byId('loginForm').addEventListener('submit', handleLogin);
  byId('registerForm').addEventListener('submit', handleRegister);
  byId('initiativeForm').addEventListener('submit', handleInitiativeSubmit);
  byId('feedbackForm').addEventListener('submit', handleFeedbackSubmit);
  byId('issueForm').addEventListener('submit', handleIssueSubmit);
  elements.logoutBtn.addEventListener('click', logout);
  elements.cancelEditBtn.addEventListener('click', () => {
    clearInitiativeForm();
    setActiveSection('initiativesSection');
  });

  const token = localStorage.getItem('token');
  if (!token) {
    setAuthUI();
    return;
  }

  try {
    const response = await api.profile();
    state.user = response.user;
    setAuthUI();
    await loadDashboard();
  } catch (_error) {
    logout();
  }
};

boot();
