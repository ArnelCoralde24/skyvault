const demoUsers = [
  { email: 'admin@example.com', password: '123456', role: 'admin', name: 'System Admin' },
  { email: 'user@example.com', password: '123456', role: 'user', name: 'Normal User' },
];

const storageLimitBytes = 100 * 1024 * 1024;

const state = {
  currentUser: null,
  selectedUserEmail: null,
  currentPage: 'files',
  currentFolderId: null,
  search: '',
  sortBy: 'name',
  sortDir: 'asc',
  theme: localStorage.getItem('theme') || 'dark',
  notificationsEnabled: localStorage.getItem('notificationsEnabled') !== 'false',
};

const loginScreen = document.getElementById('loginScreen');
const dashboardScreen = document.getElementById('dashboardScreen');
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const logoutBtn = document.getElementById('logoutBtn');
const dashboardTitle = document.getElementById('dashboardTitle');
const dashboardSubtitle = document.getElementById('dashboardSubtitle');
const filesView = document.getElementById('filesView');
const profileView = document.getElementById('profileView');
const settingsView = document.getElementById('settingsView');
const navButtons = Array.from(document.querySelectorAll('.nav-btn'));
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const sortDirBtn = document.getElementById('sortDirBtn');
const itemsGrid = document.getElementById('itemsGrid');
const storageText = document.getElementById('storageText');
const storageFill = document.getElementById('storageFill');
const breadcrumb = document.getElementById('breadcrumb');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadStatus = document.getElementById('uploadStatus');
const progressFill = document.getElementById('progressFill');
const uploadBtn = document.getElementById('uploadBtn');
const newFolderBtn = document.getElementById('newFolderBtn');
const backFolderBtn = document.getElementById('backFolderBtn');
const adminPanel = document.getElementById('adminPanel');
const userList = document.getElementById('userList');
const adminSearchInput = document.getElementById('adminSearchInput');
const adminFilterSelect = document.getElementById('adminFilterSelect');
const adminRefreshBtn = document.getElementById('adminRefreshBtn');
const adminUsersCount = document.getElementById('adminUsersCount');
const adminActiveCount = document.getElementById('adminActiveCount');
const adminStorageCount = document.getElementById('adminStorageCount');
const activityLog = document.getElementById('activityLog');
const analyticsChart = document.getElementById('analyticsChart');
const systemStats = document.getElementById('systemStats');
const previewModal = document.getElementById('previewModal');
const previewContent = document.getElementById('previewContent');
const previewTitle = document.getElementById('previewTitle');
const closePreviewBtn = document.getElementById('closePreviewBtn');
const notificationArea = document.getElementById('notificationArea');
const notificationBell = document.getElementById('notificationBell');
const notificationCount = document.getElementById('notificationCount');
const themeToggle = document.getElementById('themeToggle');
const settingsThemeToggle = document.getElementById('settingsThemeToggle');
const notificationToggle = document.getElementById('notificationToggle');
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const profileRole = document.getElementById('profileRole');
const filesCount = document.getElementById('filesCount');
const foldersCount = document.getElementById('foldersCount');
const usedSpace = document.getElementById('usedSpace');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');

function showLogin() {
  loginScreen.classList.remove('hidden');
  dashboardScreen.classList.add('hidden');
}

function showDashboardScreen() {
  loginScreen.classList.add('hidden');
  dashboardScreen.classList.remove('hidden');
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getUsers() {
  const stored = localStorage.getItem('appUsers');
  if (stored) {
    return JSON.parse(stored);
  }
  localStorage.setItem('appUsers', JSON.stringify(demoUsers));
  return demoUsers;
}

function getCurrentUser() {
  const stored = localStorage.getItem('currentUser');
  return stored ? JSON.parse(stored) : null;
}

function setCurrentUser(user) {
  localStorage.setItem('currentUser', JSON.stringify(user));
  state.currentUser = user;
}

function getEntries() {
  const stored = localStorage.getItem('managedEntries');
  if (stored) {
    return JSON.parse(stored);
  }

  const legacyFiles = JSON.parse(localStorage.getItem('savedFiles') || '[]');
  const entries = legacyFiles.map((file) => ({
    ...file,
    kind: 'file',
    folderId: null,
    parentFolderId: null,
  }));
  localStorage.setItem('managedEntries', JSON.stringify(entries));
  return entries;
}

function saveEntries(entries) {
  localStorage.setItem('managedEntries', JSON.stringify(entries));
}

function getOwnerEmail() {
  if (!state.currentUser) return null;
  return state.currentUser.role === 'admin' && state.selectedUserEmail ? state.selectedUserEmail : state.currentUser.email;
}

function getEntriesForOwner(ownerEmail) {
  return getEntries().filter((entry) => entry.ownerEmail === ownerEmail);
}

function getCurrentFolderEntries() {
  const ownerEmail = getOwnerEmail();
  const entries = getEntriesForOwner(ownerEmail);
  return entries.filter((entry) => entry.kind === 'folder' || entry.folderId === state.currentFolderId);
}

function getFoldersForOwner(ownerEmail) {
  return getEntriesForOwner(ownerEmail).filter((entry) => entry.kind === 'folder');
}

function getFolderById(folderId, ownerEmail) {
  return getFoldersForOwner(ownerEmail).find((folder) => folder.id === folderId);
}

function getBreadcrumbPath(ownerEmail) {
  const parts = [];
  let currentId = state.currentFolderId;
  while (currentId) {
    const folder = getFolderById(currentId, ownerEmail);
    if (!folder) break;
    parts.unshift(folder.name);
    currentId = folder.parentFolderId;
  }
  return parts.length ? ['Home', ...parts] : ['Home'];
}

function getUsedBytes(ownerEmail) {
  return getEntriesForOwner(ownerEmail).filter((entry) => entry.kind === 'file').reduce((total, entry) => total + (entry.size || 0), 0);
}

function showNotification(message, kind = 'info') {
  if (!state.notificationsEnabled) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<strong>${kind === 'error' ? 'Notice' : 'Update'}</strong><div>${message}</div>`;
  notificationArea.appendChild(toast);
  updateNotificationCount();
  window.setTimeout(() => {
    toast.remove();
    updateNotificationCount();
  }, 3200);
}

function updateNotificationCount() {
  notificationCount.textContent = String(notificationArea.children.length);
}

function setTheme(theme) {
  state.theme = theme;
  document.body.classList.toggle('theme-light', theme === 'light');
  localStorage.setItem('theme', theme);
}

function renderUserList() {
  const allUsers = getUsers();
  const filteredUsers = allUsers.filter((user) => user.role === 'user').filter((user) => {
    const query = adminSearchInput?.value?.toLowerCase() || '';
    const matchesQuery = !query || user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
    const status = adminFilterSelect?.value || 'all';
    const matchesStatus = status === 'all' || (status === 'active' && !user.suspended) || (status === 'suspended' && user.suspended);
    return matchesQuery && matchesStatus;
  });

  userList.innerHTML = '';
  if (!filteredUsers.length) {
    userList.innerHTML = '<div class="empty-state">No matching users found.</div>';
    return;
  }

  filteredUsers.forEach((user) => {
    const card = document.createElement('div');
    card.className = `user-item${state.selectedUserEmail === user.email ? ' active' : ''}`;
    card.innerHTML = `
      <strong>${user.name}</strong>
      <span>${user.email}</span>
      <span class="user-status">${user.suspended ? 'Suspended' : 'Active'}</span>
      <div class="user-actions">
        <button data-action="view" data-email="${user.email}">View files</button>
        <button data-action="toggle" data-email="${user.email}">${user.suspended ? 'Activate' : 'Suspend'}</button>
        <button data-action="delete" data-email="${user.email}">Delete</button>
      </div>
    `;
    userList.appendChild(card);
  });
}

function renderItems() {
  const ownerEmail = getOwnerEmail();
  const entries = getEntriesForOwner(ownerEmail);
  const visibleEntries = entries.filter((entry) => {
    const matchesSearch = entry.name.toLowerCase().includes(state.search.toLowerCase());
    const matchesFolder = entry.kind === 'folder' ? entry.parentFolderId === state.currentFolderId : entry.folderId === state.currentFolderId;
    return matchesSearch && matchesFolder;
  });

  const sortedEntries = [...visibleEntries].sort((a, b) => {
    const dir = state.sortDir === 'asc' ? 1 : -1;
    if (state.sortBy === 'size') return ((a.size || 0) - (b.size || 0)) * dir;
    if (state.sortBy === 'type') {
      const typeA = a.kind === 'folder' ? 'folder' : (a.type || 'file');
      const typeB = b.kind === 'folder' ? 'folder' : (b.type || 'file');
      return typeA.localeCompare(typeB) * dir;
    }
    if (state.sortBy === 'date') return (new Date(a.createdAt || a.uploadedAt || 0) - new Date(b.createdAt || b.uploadedAt || 0)) * dir;
    return a.name.localeCompare(b.name) * dir;
  });

  itemsGrid.innerHTML = '';
  if (!sortedEntries.length) {
    itemsGrid.innerHTML = '<div class="empty-state">No items here yet. Add a folder or upload files.</div>';
    return;
  }

  sortedEntries.forEach((entry) => {
    const item = document.createElement('article');
    item.className = 'item-card';
    const isFolder = entry.kind === 'folder';
    item.innerHTML = `
      <div class="item-main" data-id="${entry.id}" data-kind="${entry.kind}">
        <div class="item-icon">${isFolder ? '📁' : '📄'}</div>
        <div class="item-name">${entry.name}</div>
        <div class="item-meta">
          <span>${isFolder ? 'Folder' : entry.type || 'File'}</span>
          <span>${isFolder ? '' : formatSize(entry.size || 0)}</span>
        </div>
      </div>
      <div class="item-actions">
        <button data-action="rename">Rename</button>
        <button data-action="copy">Copy</button>
        <button data-action="move">Move</button>
        <button data-action="delete">Delete</button>
        ${isFolder ? '' : '<button data-action="download">Download</button>'}
      </div>
    `;
    itemsGrid.appendChild(item);
  });
}

function renderStorage() {
  const ownerEmail = getOwnerEmail();
  const usedBytes = getUsedBytes(ownerEmail);
  const percent = Math.min(100, Math.round((usedBytes / storageLimitBytes) * 100));
  storageText.textContent = `${formatBytes(usedBytes)} of ${formatBytes(storageLimitBytes)}`;
  storageFill.style.width = `${percent}%`;
}

function renderAdminStats() {
  const allUsers = getUsers().filter((entry) => entry.role === 'user');
  const activeUsers = allUsers.filter((user) => !user.suspended);
  const totalStorage = allUsers.reduce((sum, user) => sum + getUsedBytes(user.email), 0);
  adminUsersCount.textContent = String(allUsers.length);
  adminActiveCount.textContent = String(activeUsers.length);
  adminStorageCount.textContent = `${formatBytes(totalStorage)}`;

  const bars = [18, 30, 24, 36, 44, 28];
  analyticsChart.innerHTML = bars.map((height) => `<div class="analytics-bar" style="height:${height}%"></div>`).join('');

  systemStats.innerHTML = `
    <div><span>Users online</span><strong>${activeUsers.length}</strong></div>
    <div><span>Files stored</span><strong>${getEntries().filter((entry) => entry.kind === 'file').length}</strong></div>
    <div><span>Folders</span><strong>${getEntries().filter((entry) => entry.kind === 'folder').length}</strong></div>
  `;

  const activities = [
    'Admin signed in',
    'New upload completed',
    'User account reviewed',
    'Storage threshold checked',
  ];
  activityLog.innerHTML = activities.map((entry) => `<li>${entry}</li>`).join('');
}

function renderProfile() {
  const user = state.currentUser;
  if (!user) return;
  profileName.textContent = user.name;
  profileEmail.textContent = user.email;
  profileRole.textContent = user.role === 'admin' ? 'Administrator' : 'Standard user';
  const ownerEmail = getOwnerEmail();
  const entries = getEntriesForOwner(ownerEmail);
  filesCount.textContent = entries.filter((item) => item.kind === 'file').length;
  foldersCount.textContent = entries.filter((item) => item.kind === 'folder').length;
  usedSpace.textContent = `${formatBytes(getUsedBytes(ownerEmail))}`;
}

function renderBreadcrumb() {
  const ownerEmail = getOwnerEmail();
  const parts = getBreadcrumbPath(ownerEmail);
  breadcrumb.textContent = parts.join(' / ');
  backFolderBtn.classList.toggle('hidden', state.currentFolderId === null);
}

function renderDashboard() {
  const user = state.currentUser;
  if (!user) {
    showLogin();
    return;
  }
  showDashboardScreen();

  if (user.role === 'admin') {
    const normalUsers = getUsers().filter((entry) => entry.role === 'user');
    if (!state.selectedUserEmail || !normalUsers.some((entry) => entry.email === state.selectedUserEmail)) {
      state.selectedUserEmail = normalUsers[0]?.email || null;
    }
  }

  dashboardTitle.textContent = user.role === 'admin' ? 'Admin Dashboard' : 'User Dashboard';
  dashboardSubtitle.textContent = user.role === 'admin' ? 'Review files and folders for every normal user.' : 'Organize your files and folders.';
  adminPanel.classList.toggle('hidden', user.role !== 'admin');
  navButtons.forEach((button) => button.classList.toggle('active', button.dataset.view === state.currentPage));
  filesView.classList.toggle('hidden', state.currentPage !== 'files');
  profileView.classList.toggle('hidden', state.currentPage !== 'profile');
  settingsView.classList.toggle('hidden', state.currentPage !== 'settings');
  themeToggle.textContent = state.theme === 'dark' ? '☀' : '🌙';
  settingsThemeToggle.textContent = state.theme === 'dark' ? 'Switch to light' : 'Switch to dark';
  notificationToggle.textContent = state.notificationsEnabled ? 'Enabled' : 'Disabled';
  sortDirBtn.textContent = state.sortDir === 'asc' ? '↑' : '↓';
  renderUserList();
  renderItems();
  renderStorage();
  renderProfile();
  renderBreadcrumb();
  if (user.role === 'admin') {
    renderAdminStats();
  }
}

function createFolder(name, parentFolderId = null) {
  const ownerEmail = getOwnerEmail();
  const entries = getEntries();
  entries.push({
    id: crypto.randomUUID(),
    kind: 'folder',
    name,
    ownerEmail,
    parentFolderId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  saveEntries(entries);
  showNotification(`Folder created: ${name}`);
  renderDashboard();
}

async function uploadFiles(fileList) {
  const ownerEmail = getOwnerEmail();
  if (!ownerEmail) return;
  if (!fileList.length) {
    showNotification('Select one or more files first.', 'error');
    return;
  }
  uploadStatus.textContent = 'Uploading...';
  progressFill.style.width = '0%';
  const entries = getEntries();
  for (let index = 0; index < fileList.length; index += 1) {
    const file = fileList[index];
    const dataUrl = await readFileAsDataUrl(file);
    entries.push({
      id: crypto.randomUUID(),
      kind: 'file',
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      dataUrl,
      ownerEmail,
      folderId: state.currentFolderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    progressFill.style.width = `${Math.round(((index + 1) / fileList.length) * 100)}%`;
  }
  saveEntries(entries);
  uploadStatus.textContent = `${fileList.length} file(s) uploaded successfully.`;
  progressFill.style.width = '100%';
  fileInput.value = '';
  showNotification('Files uploaded successfully.');
  renderDashboard();
}

function openPreview(entry) {
  if (!entry) return;
  previewTitle.textContent = entry.name;
  if (entry.kind === 'folder') {
    previewContent.innerHTML = '<div class="empty-state">Folder preview is not available.</div>';
  } else if (entry.type.startsWith('image/')) {
    previewContent.innerHTML = `<img src="${entry.dataUrl}" alt="${entry.name}" />`;
  } else if (entry.type.startsWith('video/')) {
    previewContent.innerHTML = `<video controls src="${entry.dataUrl}"></video>`;
  } else if (entry.type === 'application/pdf') {
    previewContent.innerHTML = `<iframe src="${entry.dataUrl}"></iframe>`;
  } else if (entry.type.startsWith('text/') || /\.(txt|md|json|csv)$/i.test(entry.name)) {
    previewContent.innerHTML = `<pre>${entry.dataUrl}</pre>`;
  } else {
    previewContent.innerHTML = '<div class="empty-state">Preview is not supported for this file type.</div>';
  }
  previewModal.classList.remove('hidden');
}

function renameEntry(entry) {
  const nextName = prompt('Enter a new name', entry.name);
  if (!nextName || !nextName.trim()) return;
  const entries = getEntries();
  const target = entries.find((item) => item.id === entry.id);
  if (target) {
    target.name = nextName.trim();
    target.updatedAt = new Date().toISOString();
    saveEntries(entries);
    showNotification('Item renamed.');
    renderDashboard();
  }
}

function moveEntry(entry) {
  const targetName = prompt('Move to folder name (leave blank for root)', '');
  if (targetName === null) return;
  const ownerEmail = getOwnerEmail();
  const folder = getFoldersForOwner(ownerEmail).find((item) => item.name.toLowerCase() === targetName.trim().toLowerCase());
  const entries = getEntries();
  const target = entries.find((item) => item.id === entry.id);
  if (target) {
    target.folderId = targetName.trim() ? folder?.id || null : null;
    target.updatedAt = new Date().toISOString();
    saveEntries(entries);
    showNotification('Item moved.');
    renderDashboard();
  }
}

function copyEntry(entry) {
  const entries = getEntries();
  const copy = {
    ...entry,
    id: crypto.randomUUID(),
    name: `${entry.name} copy`,
    folderId: entry.folderId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  entries.push(copy);
  saveEntries(entries);
  showNotification('Item copied.');
  renderDashboard();
}

function deleteEntry(entry) {
  if (!confirm(`Delete ${entry.name}?`)) return;
  const entries = getEntries().filter((item) => item.id !== entry.id);
  saveEntries(entries);
  showNotification('Item deleted.');
  renderDashboard();
}

function manageUser(email, action) {
  const users = getUsers();
  const target = users.find((user) => user.email === email);
  if (!target) return;

  if (action === 'toggle') {
    target.suspended = !target.suspended;
    showNotification(target.suspended ? 'Account suspended.' : 'Account activated.');
  }

  if (action === 'delete') {
    const index = users.findIndex((user) => user.email === email);
    users.splice(index, 1);
    showNotification('User deleted.');
  }

  localStorage.setItem('appUsers', JSON.stringify(users));
  renderDashboard();
}

function downloadEntry(entry) {
  if (entry.kind === 'folder') return;
  const link = document.createElement('a');
  link.href = entry.dataUrl;
  link.download = entry.name;
  link.click();
  showNotification('Download started.');
}

function handleItemsClick(event) {
  const userActionButton = event.target.closest('button[data-action]');
  if (userActionButton && userActionButton.dataset.action) {
    const action = userActionButton.dataset.action;
    const email = userActionButton.dataset.email;
    if (action === 'view') {
      state.selectedUserEmail = email;
      state.currentFolderId = null;
      state.currentPage = 'files';
      renderDashboard();
      return;
    }
    manageUser(email, action);
    return;
  }

  const actionButton = event.target.closest('button[data-action]');
  if (actionButton) {
    const action = actionButton.dataset.action;
    const itemCard = actionButton.closest('.item-card');
    const entryId = itemCard?.querySelector('.item-main')?.dataset.id;
    const entries = getEntries();
    const entry = entries.find((item) => item.id === entryId);
    if (!entry) return;
    if (action === 'rename') renameEntry(entry);
    if (action === 'copy') copyEntry(entry);
    if (action === 'move') moveEntry(entry);
    if (action === 'delete') deleteEntry(entry);
    if (action === 'download') downloadEntry(entry);
    return;
  }

  const main = event.target.closest('.item-main');
  if (!main) return;
  const entryId = main.dataset.id;
  const entry = getEntries().find((item) => item.id === entryId);
  if (!entry) return;
  if (entry.kind === 'folder') {
    state.currentFolderId = entry.id;
    renderDashboard();
  } else {
    openPreview(entry);
  }
}

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const matchedUser = getUsers().find((entry) => entry.email.toLowerCase() === email.toLowerCase() && entry.password === password);
  if (matchedUser) {
    if (matchedUser.suspended) {
      loginMessage.textContent = 'This account is suspended.';
      return;
    }
    setCurrentUser(matchedUser);
    state.selectedUserEmail = null;
    state.currentPage = 'files';
    state.currentFolderId = null;
    loginMessage.textContent = '';
    renderDashboard();
  } else {
    loginMessage.textContent = 'Invalid email or password.';
  }
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('currentUser');
  state.currentUser = null;
  showLogin();
});

navButtons.forEach((button) => {
  button.addEventListener('click', () => {
    state.currentPage = button.dataset.view;
    renderDashboard();
  });
});

searchInput.addEventListener('input', (event) => {
  state.search = event.target.value;
  renderItems();
});

adminSearchInput.addEventListener('input', () => renderUserList());
adminFilterSelect.addEventListener('change', () => renderUserList());
adminRefreshBtn.addEventListener('click', () => renderDashboard());

sortSelect.addEventListener('change', (event) => {
  state.sortBy = event.target.value;
  renderItems();
});
sortDirBtn.addEventListener('click', () => {
  state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
  renderItems();
});

uploadBtn.addEventListener('click', () => fileInput.click());
newFolderBtn.addEventListener('click', () => {
  const name = prompt('Folder name');
  if (name && name.trim()) createFolder(name.trim(), state.currentFolderId);
});
backFolderBtn.addEventListener('click', () => {
  if (!state.currentFolderId) return;
  const ownerEmail = getOwnerEmail();
  const folder = getFoldersForOwner(ownerEmail).find((entry) => entry.id === state.currentFolderId);
  state.currentFolderId = folder ? folder.parentFolderId : null;
  renderDashboard();
});

fileInput.addEventListener('change', (event) => uploadFiles(Array.from(event.target.files || [])));
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropZone.classList.add('drag-over');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropZone.classList.remove('drag-over');
  uploadFiles(Array.from(event.dataTransfer?.files || []));
});

itemsGrid.addEventListener('click', handleItemsClick);
closePreviewBtn.addEventListener('click', () => previewModal.classList.add('hidden'));
previewModal.addEventListener('click', (event) => {
  if (event.target === previewModal) previewModal.classList.add('hidden');
});

themeToggle.addEventListener('click', () => {
  setTheme(state.theme === 'dark' ? 'light' : 'dark');
  renderDashboard();
});
settingsThemeToggle.addEventListener('click', () => {
  setTheme(state.theme === 'dark' ? 'light' : 'dark');
  renderDashboard();
});
notificationToggle.addEventListener('click', () => {
  state.notificationsEnabled = !state.notificationsEnabled;
  localStorage.setItem('notificationsEnabled', String(state.notificationsEnabled));
  renderDashboard();
  showNotification(state.notificationsEnabled ? 'Notifications enabled.' : 'Notifications disabled.');
});
menuToggle.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});
notificationBell.addEventListener('click', () => {
  notificationArea.innerHTML = '';
  notificationCount.textContent = '0';
});

function init() {
  setTheme(state.theme);
  state.currentUser = getCurrentUser();
  if (state.currentUser) {
    renderDashboard();
  } else {
    showLogin();
  }
}

init();
