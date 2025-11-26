const STORAGE_KEY = 'qoh-data';
const SESSION_KEY = 'qoh-current-player';
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function seedDemoData() {
  const now = new Date();
  const earlier = new Date(now.getTime() - 1000 * 60 * 60 * 3);
  const players = [
    {
      id: 1,
      name: 'Ava Hearts',
      email: 'ava@example.com',
      wallet: 250,
      gameAccounts: [
        { id: 1, game: 'Ultra Panda', username: 'avaQueen', balance: 120 },
        { id: 2, game: 'Fire Kirin', username: 'avaFlame', balance: 55 },
      ],
      activity: [
        { message: 'Transfer of $40 to Fire Kirin completed automatically.', time: earlier.toISOString() },
        { message: 'Ultra Panda account created automatically as avaQueen.', time: earlier.toISOString() },
        { message: '$100 added via tierlock', time: now.toISOString() },
      ],
    },
    {
      id: 2,
      name: 'Leo Club',
      email: 'leo@example.com',
      wallet: 80,
      gameAccounts: [
        { id: 3, game: 'Ultra Panda', username: 'lionking', balance: 0 },
      ],
      activity: [
        { message: '$80 added via bitcoin', time: now.toISOString() },
      ],
    },
  ];

  const transfers = [
    {
      id: 1,
      playerId: 1,
      gameAccountId: 1,
      amount: 60,
      status: 'approved',
      requestedAt: earlier.toISOString(),
      approvedAt: earlier.toISOString(),
    },
  ];

  return {
    nextPlayerId: 3,
    nextGameId: 4,
    nextTransferId: 3,
    players,
    transfers,
  };
}

function cloneData(value) {
  // Safe copy that works on browsers without structuredClone
  return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

const defaultData = seedDemoData();

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    const seeded = cloneData(defaultData);
    saveData(seeded);
    return seeded;
  }
  try {
    const parsed = JSON.parse(saved);
    const merged = { ...cloneData(defaultData), ...parsed };
    // ensure seeded content when storage is empty or malformed
    if (!merged.players.length) {
      saveData(defaultData);
      return cloneData(defaultData);
    }
    return merged;
  } catch (error) {
    console.error('Failed to parse stored data', error);
    saveData(defaultData);
    return cloneData(defaultData);
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getCurrentPlayerId() {
  const saved = localStorage.getItem(SESSION_KEY);
  return saved ? Number(saved) : null;
}

function setCurrentPlayer(id) {
  if (id === null) {
    localStorage.removeItem(SESSION_KEY);
  } else {
    localStorage.setItem(SESSION_KEY, String(id));
  }
}

function addActivity(player, message) {
  const entry = { message, time: new Date().toISOString() };
  player.activity = [entry, ...(player.activity || [])].slice(0, 50);
}

function ensurePlayer(data, id) {
  return data.players.find((p) => p.id === id) || null;
}

function uniqueUsername(base, existing) {
  let candidate = base.toLowerCase();
  let suffix = 1;
  while (existing.includes(candidate)) {
    suffix += 1;
    candidate = `${base}${suffix}`.toLowerCase();
  }
  return candidate;
}

function suggestUsername(player, gameName) {
  const first = (player?.name || 'player').split(/\s+/)[0].toLowerCase();
  const game = (gameName || 'game').replace(/\s+/g, '').toLowerCase();
  const base = `${first}${game}`;
  const existing = (player?.gameAccounts || []).map((g) => g.username.toLowerCase());
  return uniqueUsername(base, existing);
}

function formatTransferRow(transfer, player, game) {
  const statusBadge = transfer.status === 'approved' ? 'badge' : 'badge neutral';
  const approvedInfo = transfer.approvedAt ? new Date(transfer.approvedAt).toLocaleString() : '—';
  return `<div class="row">` +
    `<div><strong>${player?.name || 'Unknown'}</strong><p class="muted">${game?.game}</p></div>` +
    `<div>${currency.format(transfer.amount)}</div>` +
    `<div><span class="${statusBadge}">${transfer.status}</span></div>` +
    `<div>${new Date(transfer.requestedAt).toLocaleString()}</div>` +
    `<div>${approvedInfo}</div>` +
    `</div>`;
}

function renderEmptyState(target, message) {
  target.innerHTML = `<div class="empty">${message}</div>`;
}

function renderActivity(listEl, activity = []) {
  listEl.innerHTML = '';
  if (!activity.length) {
    const li = document.createElement('li');
    li.textContent = 'No activity yet.';
    listEl.appendChild(li);
    return;
  }
  activity.forEach((entry) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${entry.message}</span><time>${new Date(entry.time).toLocaleString()}</time>`;
    listEl.appendChild(li);
  });
}

function initLanding() {
  // nothing dynamic yet
}

function initPlayerPage() {
  let data = loadData();
  const resetButton = document.getElementById('player-reset');
  const loginSelect = document.getElementById('player-login');
  const activePlayerLabel = document.getElementById('active-player-label');
  const walletOwner = document.getElementById('wallet-owner');
  const walletBalance = document.getElementById('wallet-balance');
  const gameAccounts = document.getElementById('game-accounts');
  const transferGameSelect = document.getElementById('transfer-game');
  const gameCreateForm = document.getElementById('create-game-form');
  const newGameSelect = document.getElementById('new-game-name');
  const newGameUsername = document.getElementById('new-game-username');
  const activityList = document.getElementById('player-activity');
  const transferTable = document.getElementById('player-transfers');

  function resetGameUsernameSuggestion(player) {
    if (!player || !newGameSelect) return;
    newGameUsername.value = suggestUsername(player, newGameSelect.value);
  }

  function ensureActivePlayer() {
    const currentId = getCurrentPlayerId();
    const currentPlayer = ensurePlayer(data, currentId);
    if (currentPlayer) return currentPlayer;
    if (data.players.length) {
      const fallback = data.players[0];
      setCurrentPlayer(fallback.id);
      return fallback;
    }
    setCurrentPlayer(null);
    return null;
  }

  function refreshLoginOptions(selectedId = getCurrentPlayerId()) {
    loginSelect.innerHTML = '';
    if (!data.players.length) {
      const option = document.createElement('option');
      option.textContent = 'No players yet';
      option.disabled = true;
      loginSelect.appendChild(option);
      activePlayerLabel.textContent = 'Guest';
      setCurrentPlayer(null);
      return;
    }
    data.players.forEach((player) => {
      const option = document.createElement('option');
      option.value = player.id;
      option.textContent = `${player.name} (${player.email})`;
      if (selectedId && Number(selectedId) === player.id) option.selected = true;
      loginSelect.appendChild(option);
    });
    const chosen = loginSelect.value ? Number(loginSelect.value) : data.players[0].id;
    setCurrentPlayer(chosen);
  }

  function renderForPlayer(player) {
    if (!player) {
      walletOwner.textContent = 'Wallet balance';
      walletBalance.textContent = '$0';
      renderEmptyState(gameAccounts, 'No player selected.');
      renderEmptyState(transferTable, 'No player selected.');
      renderActivity(activityList, []);
      activePlayerLabel.textContent = 'Guest';
      return;
    }

    walletOwner.textContent = `${player.name}'s wallet`;
    walletBalance.textContent = currency.format(player.wallet);
    activePlayerLabel.textContent = player.name;

    transferGameSelect.innerHTML = '';
    gameAccounts.innerHTML = '';
    if (!player.gameAccounts.length) {
      renderEmptyState(gameAccounts, 'No game accounts assigned yet.');
      const option = document.createElement('option');
      option.textContent = 'No game accounts';
      option.disabled = true;
      transferGameSelect.appendChild(option);
    } else {
      player.gameAccounts.forEach((game) => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.innerHTML = `
          <div class="card-header">
            <div>
              <p class="eyebrow">${game.game}</p>
              <h4>${game.username}</h4>
            </div>
            <span class="badge neutral">Balance</span>
          </div>
          <p>Credits: <strong>${currency.format(game.balance)}</strong></p>
        `;
        gameAccounts.appendChild(card);

        const option = document.createElement('option');
        option.value = game.id;
        option.textContent = `${game.game} • ${game.username}`;
        transferGameSelect.appendChild(option);
      });
    }

    const playerTransfers = data.transfers.filter((t) => t.playerId === player.id);
    if (!playerTransfers.length) {
      renderEmptyState(transferTable, 'No transfers yet.');
    } else {
      transferTable.innerHTML = '<div class="row head"><div>Player</div><div>Amount</div><div>Status</div><div>Requested</div><div>Approved</div></div>' +
        playerTransfers.map((t) => formatTransferRow(t, player, player.gameAccounts.find((g) => g.id === t.gameAccountId))).join('');
    }

    renderActivity(activityList, player.activity || []);
    resetGameUsernameSuggestion(player);
  }

  refreshLoginOptions();
  renderForPlayer(ensureActivePlayer());

  loginSelect.addEventListener('change', () => {
    const id = Number(loginSelect.value);
    setCurrentPlayer(id);
    renderForPlayer(ensureActivePlayer());
  });

  document.getElementById('signup-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.target;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    if (!name || !email) return;
    const player = { id: data.nextPlayerId++, name, email, wallet: 0, gameAccounts: [], activity: [] };
    addActivity(player, `Account created for ${name}`);
    data.players.push(player);
    saveData(data);
    refreshLoginOptions(player.id);
    renderForPlayer(player);
    form.reset();
  });

  gameCreateForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const player = ensureActivePlayer();
    if (!player) return alert('Select or create a player first.');
    const gameName = newGameSelect.value;
    const username = (newGameUsername.value || suggestUsername(player, gameName)).trim();
    const account = { id: data.nextGameId++, game: gameName, username, balance: 0 };
    player.gameAccounts.push(account);
    addActivity(player, `${gameName} account created automatically as ${username}.`);
    saveData(data);
    renderForPlayer(player);
    resetGameUsernameSuggestion(player);
  });

  newGameSelect.addEventListener('change', () => {
    const player = ensureActivePlayer();
    resetGameUsernameSuggestion(player);
  });

  document.getElementById('deposit-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const player = ensureActivePlayer();
    if (!player) return alert('Select or create a player first.');
    const form = event.target;
    const amount = parseInt(form.amount.value, 10) || 0;
    const method = form.method.value;
    if (amount <= 0) return;
    player.wallet += amount;
    addActivity(player, `${currency.format(amount)} added via ${method}`);
    saveData(data);
    renderForPlayer(player);
  });

  document.getElementById('transfer-request').addEventListener('submit', (event) => {
    event.preventDefault();
    const player = ensureActivePlayer();
    if (!player) return alert('Select or create a player first.');
    const form = event.target;
    const gameId = Number(form.game.value);
    const amount = parseInt(form.amount.value, 10) || 0;
    const game = player.gameAccounts.find((g) => g.id === gameId);
    if (!game) return alert('Pick a game account.');
    if (amount <= 0) return;
    if (amount > player.wallet) return alert('Not enough wallet credits.');

    player.wallet -= amount;
    game.balance += amount;
    const transfer = {
      id: data.nextTransferId++,
      playerId: player.id,
      gameAccountId: game.id,
      amount,
      status: 'approved',
      requestedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
    };
    data.transfers.unshift(transfer);
    addActivity(player, `Transferred ${currency.format(amount)} to ${game.game} automatically.`);
    saveData(data);
    renderForPlayer(player);
    form.reset();
    refreshLoginOptions(player.id);
  });

  resetButton.addEventListener('click', () => {
    const seeded = seedDemoData();
    saveData(seeded);
    setCurrentPlayer(seeded.players[0].id);
    data = seeded;
    refreshLoginOptions(seeded.players[0].id);
    renderForPlayer(seeded.players[0]);
  });

  window.addEventListener('storage', (event) => {
    if (![STORAGE_KEY, SESSION_KEY].includes(event.key)) return;
    data = loadData();
    refreshLoginOptions();
    renderForPlayer(ensureActivePlayer());
  });
}

function initAdminPage() {
  let data = loadData();
  const resetButton = document.getElementById('admin-reset');
  const playersTable = document.getElementById('admin-players');
  const transfersTable = document.getElementById('admin-transfers');
  const playerCount = document.getElementById('player-count');
  const pendingCount = document.getElementById('pending-count');
  const gamePlayerSelect = document.getElementById('game-player');

  function renderPlayers() {
    playerCount.textContent = `${data.players.length} players`;
    if (!data.players.length) return renderEmptyState(playersTable, 'No players yet.');
    playersTable.innerHTML = '<div class="row head"><div>Name</div><div>Wallet</div><div>Games</div><div>Last activity</div></div>' +
      data.players.map((p) => {
        const last = p.activity?.[0]?.time ? new Date(p.activity[0].time).toLocaleString() : '—';
        return `<div class="row"><div><strong>${p.name}</strong><p class="muted">${p.email}</p></div><div>${currency.format(p.wallet)}</div><div>${p.gameAccounts.length}</div><div>${last}</div></div>`;
      }).join('');
  }

  function renderGamePlayerOptions() {
    gamePlayerSelect.innerHTML = '';
    if (!data.players.length) {
      const option = document.createElement('option');
      option.textContent = 'No players yet';
      option.disabled = true;
      gamePlayerSelect.appendChild(option);
      return;
    }
    data.players.forEach((p) => {
      const option = document.createElement('option');
      option.value = p.id;
      option.textContent = `${p.name} (${p.email})`;
      gamePlayerSelect.appendChild(option);
    });
  }

  function renderTransfers() {
    const pending = data.transfers.filter((t) => t.status === 'pending');
    pendingCount.textContent = `${pending.length} pending`;
    if (!data.transfers.length) return renderEmptyState(transfersTable, 'No transfer requests yet.');
    transfersTable.innerHTML = '<div class="row head"><div>Player</div><div>Amount</div><div>Status</div><div>Requested</div><div>Approved</div><div>Action</div></div>' +
      data.transfers.map((t) => {
        const player = ensurePlayer(data, t.playerId);
        const game = player?.gameAccounts.find((g) => g.id === t.gameAccountId);
        const approvedInfo = t.approvedAt ? new Date(t.approvedAt).toLocaleString() : '—';
        const statusBadge = t.status === 'approved' ? 'badge' : 'badge neutral';
        const action = t.status === 'pending' ? `<button class="btn small" data-action="approve" data-id="${t.id}">Approve</button>` : '';
        return `<div class="row">` +
          `<div><strong>${player?.name || 'Unknown'}</strong><p class="muted">${game?.game || ''} • ${game?.username || ''}</p></div>` +
          `<div>${currency.format(t.amount)}</div>` +
          `<div><span class="${statusBadge}">${t.status}</span></div>` +
          `<div>${new Date(t.requestedAt).toLocaleString()}</div>` +
          `<div>${approvedInfo}</div>` +
          `<div>${action}</div>` +
          `</div>`;
      }).join('');
  }

  renderPlayers();
  renderTransfers();
  renderGamePlayerOptions();

  document.getElementById('admin-create-player').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.target;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    if (!name || !email) return;
    const player = { id: data.nextPlayerId++, name, email, wallet: 0, gameAccounts: [], activity: [] };
    addActivity(player, `Admin created account for ${name}`);
    data.players.push(player);
    saveData(data);
    renderPlayers();
    renderGamePlayerOptions();
    form.reset();
  });

  document.getElementById('game-account-form').addEventListener('submit', (event) => {
    event.preventDefault();
    if (!data.players.length) return alert('Create a player first.');
    const form = event.target;
    const playerId = Number(form.player.value);
    const gameName = form.game.value.trim();
    const username = form.username.value.trim();
    const player = ensurePlayer(data, playerId);
    if (!player || !gameName || !username) return;
    player.gameAccounts.push({ id: data.nextGameId++, game: gameName, username, balance: 0 });
    addActivity(player, `Admin added ${gameName} account (${username}).`);
    saveData(data);
    renderPlayers();
    renderTransfers();
    form.reset();
    renderGamePlayerOptions();
  });

  transfersTable.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action="approve"]');
    if (!button) return;
    const transferId = Number(button.dataset.id);
    const transfer = data.transfers.find((t) => t.id === transferId);
    if (!transfer || transfer.status !== 'pending') return;
    const player = ensurePlayer(data, transfer.playerId);
    const game = player?.gameAccounts.find((g) => g.id === transfer.gameAccountId);
    if (!player || !game) return;

    transfer.status = 'approved';
    transfer.approvedAt = new Date().toISOString();
    game.balance += transfer.amount;
    addActivity(player, `Transfer of ${currency.format(transfer.amount)} to ${game.game} approved.`);
    saveData(data);
    renderPlayers();
    renderTransfers();
  });

  resetButton.addEventListener('click', () => {
    const seeded = seedDemoData();
    saveData(seeded);
    data = seeded;
    renderPlayers();
    renderTransfers();
    renderGamePlayerOptions();
  });

  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    data = loadData();
    renderPlayers();
    renderTransfers();
    renderGamePlayerOptions();
  });
}

const page = document.body.dataset.page;
if (page === 'player') {
  initPlayerPage();
} else if (page === 'admin') {
  initAdminPage();
} else {
  initLanding();
}
