/* SECURE PRODUCTIVITY DASHBOARD - AETHERTODO LOGIC */

(function () {
  // --- STATE VARIABLES ---
  let sessionPassword = "";
  let todos = [];
  let pomoCount = 0;
  let settings = {
    theme: "dark",
    autoLockSeconds: 300,
    weatherCity: "Almaty",
    pomoCount: 0
  };
  
  // --- DOM SELECTORS ---
  const authOverlay = document.querySelector("#auth-overlay");
  const setupForm = document.querySelector("#setup-form");
  const unlockForm = document.querySelector("#unlock-form");
  const authSubtitle = document.querySelector("#auth-subtitle");
  const authError = document.querySelector("#auth-error");
  const resetWorkspaceLink = document.querySelector("#reset-workspace-link");
  
  const appContainer = document.querySelector("#app-container");
  const welcomeText = document.querySelector(".welcome-text");
  const currentDate = document.querySelector("#current-date");
  const themeToggle = document.querySelector("#theme-toggle");
  const manualLockBtn = document.querySelector("#manual-lock-btn");
  
  const bgAudio = document.querySelector("#bg-audio");
  const musicPlayBtn = document.querySelector("#music-play-btn");
  const musicPlayIcon = document.querySelector("#music-play-icon");
  const musicVolume = document.querySelector("#music-volume");
  const musicPlayerMini = document.querySelector(".music-player-mini");
  
  // Todo form elements
  const todoFormElement = document.querySelector("#todo-form-element");
  const todoInput = document.querySelector("#todo-input");
  const todoCategory = document.querySelector("#todo-category");
  const todoDueDate = document.querySelector("#todo-due-date");
  const todoList = document.querySelector("#todo-list");
  const toggleDetailsBtn = document.querySelector("#toggle-details-btn");
  const formDetailsCollapse = document.querySelector("#form-details-collapse");
  
  // Searching & Filters
  const todoSearchInput = document.querySelector("#todo-search-input");
  const filterTabs = document.querySelectorAll(".filter-tab");
  const todoSortSelect = document.querySelector("#todo-sort-select");
  
  // Widgets
  const pomoTimeDisplay = document.querySelector("#pomo-time");
  const pomoProgressRing = document.querySelector("#pomo-progress-ring");
  const pomoStartBtn = document.querySelector("#pomo-start-btn");
  const pomoResetBtn = document.querySelector("#pomo-reset-btn");
  const pomoCountDisplay = document.querySelector("#pomo-count");
  const pomoModeBtns = document.querySelectorAll(".pomo-mode-btn");
  
  const weatherContent = document.querySelector("#weather-content");
  const weatherCityInput = document.querySelector("#weather-city-input");
  const weatherSearchBtn = document.querySelector("#weather-search-btn");
  
  const quoteText = document.querySelector("#quote-text");
  const quoteAuthor = document.querySelector("#quote-author");
  const newQuoteBtn = document.querySelector("#new-quote-btn");
  
  const autolockSelect = document.querySelector("#autolock-select");
  const exportTodosBtn = document.querySelector("#export-todos");
  const importTodosBtn = document.querySelector("#import-todos");
  const wipeDataBtn = document.querySelector("#wipe-data-btn");
  
  // Analytics Elements
  const statsRadialBar = document.querySelector("#stats-radial-bar");
  const statsRadialPercent = document.querySelector("#stats-radial-percent");
  const statsCompleted = document.querySelector("#stats-completed");
  const statsPending = document.querySelector("#stats-pending");
  const statsTotal = document.querySelector("#stats-total");

  // Inactivity tracking
  let inactivityTimer = null;

  // VERIFIER PAYLOAD STRING
  const VERIFIER_STRING = "AetherTodoSecretVerifier";

  // --- CRYPTOGRAPHY SUBSYSTEM (Web Crypto API) ---
  
  // Derive key from password and salt using PBKDF2
  async function deriveKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );
    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  // Encrypt plaintext with password
  async function encryptData(plaintext, password) {
    const enc = new TextEncoder();
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    
    const ciphertext = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      enc.encode(plaintext)
    );
    
    // Convert array buffers to base64
    const saltB64 = btoa(String.fromCharCode(...salt));
    const ivB64 = btoa(String.fromCharCode(...iv));
    const ciphertextB64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)));
    
    return JSON.stringify({
      salt: saltB64,
      iv: ivB64,
      ciphertext: ciphertextB64
    });
  }

  // Decrypt ciphertext with password
  async function decryptData(encryptedJSON, password) {
    try {
      const encryptedObj = JSON.parse(encryptedJSON);
      const dec = new TextDecoder();
      
      const salt = new Uint8Array(atob(encryptedObj.salt).split("").map(c => c.charCodeAt(0)));
      const iv = new Uint8Array(atob(encryptedObj.iv).split("").map(c => c.charCodeAt(0)));
      const ciphertext = new Uint8Array(atob(encryptedObj.ciphertext).split("").map(c => c.charCodeAt(0)));
      
      const key = await deriveKey(password, salt);
      
      const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        ciphertext
      );
      
      return dec.decode(decrypted);
    } catch (e) {
      throw new Error("Decryption failed. Invalid password or corrupted data.");
    }
  }

  // --- CRYPTO DATA STORAGE ---
  async function saveToStorageSecurely() {
    if (!sessionPassword) return;
    try {
      const encryptedTodos = await encryptData(JSON.stringify(todos), sessionPassword);
      localStorage.setItem("secured_todos", encryptedTodos);
      
      const encryptedSettings = await encryptData(JSON.stringify(settings), sessionPassword);
      localStorage.setItem("secured_settings", encryptedSettings);
    } catch (error) {
      console.error("Storage save failed:", error);
    }
  }

  async function loadFromStorageSecurely() {
    if (!sessionPassword) return;
    
    const securedTodos = localStorage.getItem("secured_todos");
    if (securedTodos) {
      try {
        const decrypted = await decryptData(securedTodos, sessionPassword);
        todos = JSON.parse(decrypted);
      } catch (e) {
        console.error("Error decrypting todos:", e);
      }
    } else {
      todos = [];
    }

    const securedSettings = localStorage.getItem("secured_settings");
    if (securedSettings) {
      try {
        const decrypted = await decryptData(securedSettings, sessionPassword);
        settings = JSON.parse(decrypted);
        // Apply settings
        applySettings();
      } catch (e) {
        console.error("Error decrypting settings:", e);
      }
    }
  }

  function applySettings() {
    // Theme
    if (settings.theme === "light") {
      document.body.classList.remove("dark-theme");
      document.body.classList.add("light-theme");
    } else {
      document.body.classList.remove("light-theme");
      document.body.classList.add("dark-theme");
    }
    
    // Auto lock seconds
    autolockSelect.value = settings.autoLockSeconds.toString();
    
    // Weather City
    if (settings.weatherCity) {
      weatherCityInput.value = settings.weatherCity;
    }
    
    // Pomodoro count
    pomoCount = settings.pomoCount || 0;
    pomoCountDisplay.textContent = `Completed: ${pomoCount}`;
  }

  // --- AUDIO SYNTHESIS (Chime for Pomodoro and Task completion) ---
  function playSynthNotification(type = "success") {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      if (type === "success") {
        // Double sweet note chime
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc1.type = "sine";
        osc2.type = "sine";
        
        osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc1.start();
        osc1.stop(ctx.currentTime + 0.6);
        osc2.start(ctx.currentTime + 0.1);
        osc2.stop(ctx.currentTime + 0.6);
      } else if (type === "pomo") {
        // Triumph chime
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.15); // A5
        
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
      }
    } catch (e) {
      console.warn("Audio Context synthesis is blocked or unsupported.", e);
    }
  }

  // --- SESSION CONTROL (Locking/Unlocking) ---
  
  function checkFirstLaunch() {
    const securedVerifier = localStorage.getItem("secured_verifier");
    if (!securedVerifier) {
      // Setup Mode
      authSubtitle.textContent = "Create Master Password to initialize database";
      setupForm.classList.remove("hidden");
      unlockForm.classList.add("hidden");
    } else {
      // Unlock Mode
      authSubtitle.textContent = "Secure, local-first encrypted workspace";
      setupForm.classList.add("hidden");
      unlockForm.classList.remove("hidden");
    }
  }

  async function handleSetup(e) {
    e.preventDefault();
    const newPwd = document.querySelector("#new-password").value;
    const confirmPwd = document.querySelector("#confirm-password").value;
    
    if (newPwd !== confirmPwd) {
      alert("Passwords do not match!");
      return;
    }
    
    try {
      // Create secured verifier
      const verifierObjectStr = await encryptData(VERIFIER_STRING, newPwd);
      localStorage.setItem("secured_verifier", verifierObjectStr);
      
      // Store in session variable
      sessionPassword = newPwd;
      
      // Create empty todos and default settings
      todos = [];
      settings = {
        theme: "dark",
        autoLockSeconds: 300,
        weatherCity: "Almaty",
        pomoCount: 0
      };
      
      await saveToStorageSecurely();
      
      // Transition UI
      unlockApp();
    } catch (error) {
      console.error(error);
      alert("Setup failed. Please try again.");
    }
  }

  async function handleUnlock(e) {
    e.preventDefault();
    const password = document.querySelector("#unlock-password").value;
    const securedVerifier = localStorage.getItem("secured_verifier");
    
    if (!securedVerifier) return;
    
    try {
      // Attempt decryption of verifier
      const decryptedVerifier = await decryptData(securedVerifier, password);
      
      if (decryptedVerifier === VERIFIER_STRING) {
        // Success
        sessionPassword = password;
        authError.classList.add("hidden");
        document.querySelector("#unlock-password").value = "";
        
        await loadFromStorageSecurely();
        unlockApp();
      } else {
        showAuthError();
      }
    } catch (error) {
      showAuthError();
    }
  }

  function showAuthError() {
    authError.classList.remove("hidden");
    authError.textContent = "Invalid master password. Please try again.";
  }

  function unlockApp() {
    authOverlay.classList.add("hidden");
    appContainer.classList.remove("hidden");
    
    // Update dates, render list, trigger widgets
    updateHeaderDate();
    renderTodos();
    initWidgets();
    
    // Start inactivity listener
    resetInactivityTimer();
    window.addEventListener("mousemove", resetInactivityTimer);
    window.addEventListener("keydown", resetInactivityTimer);
    window.addEventListener("click", resetInactivityTimer);
  }

  function lockApp() {
    sessionPassword = "";
    todos = [];
    
    // Clean DOM to prevent visual leakage of tasks
    todoList.innerHTML = "";
    
    appContainer.classList.add("hidden");
    authOverlay.classList.remove("hidden");
    
    // Reset inputs
    document.querySelector("#unlock-password").value = "";
    authError.classList.add("hidden");
    
    // Stop inactivity listener
    window.removeEventListener("mousemove", resetInactivityTimer);
    window.removeEventListener("keydown", resetInactivityTimer);
    window.removeEventListener("click", resetInactivityTimer);
    
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }
    
    // Stop Pomodoro
    stopPomoTimer();
    
    // Stop background music
    if (bgAudio && !bgAudio.paused) {
      toggleMusic();
    }
    
    checkFirstLaunch();
    lucide.createIcons();
  }

  function resetInactivityTimer() {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }
    if (settings.autoLockSeconds > 0 && sessionPassword) {
      inactivityTimer = setTimeout(() => {
        lockApp();
      }, settings.autoLockSeconds * 1000);
    }
  }

  function hardResetDatabase() {
    if (confirm("WARNING: This will permanently delete all task data and reset your password. This action cannot be undone. Are you sure you want to continue?")) {
      localStorage.clear();
      sessionPassword = "";
      todos = [];
      location.reload();
    }
  }

  // --- THEME & DATE MANAGEMENT ---
  function updateHeaderDate() {
    const options = { weekday: "long", month: "long", day: "numeric", year: "numeric" };
    const today = new Date();
    currentDate.textContent = today.toLocaleDateString("en-US", options);
    
    const hours = today.getHours();
    let welcome = "Good morning";
    if (hours >= 12 && hours < 18) welcome = "Good afternoon";
    else if (hours >= 18 || hours < 4) welcome = "Good evening";
    welcomeText.textContent = `${welcome}, Creator`;
  }

  function toggleTheme() {
    if (document.body.classList.contains("dark-theme")) {
      document.body.classList.remove("dark-theme");
      document.body.classList.add("light-theme");
      settings.theme = "light";
    } else {
      document.body.classList.remove("light-theme");
      document.body.classList.add("dark-theme");
      settings.theme = "dark";
    }
    saveToStorageSecurely();
  }

  // --- AUDIO INTEGRATION ---
  function toggleMusic() {
    if (bgAudio.paused) {
      bgAudio.play().then(() => {
        musicPlayIcon.setAttribute("data-lucide", "pause");
        musicPlayerMini.classList.add("playing");
        lucide.createIcons();
      }).catch(err => {
        console.warn("Autoplay was prevented by browser:", err);
      });
    } else {
      bgAudio.pause();
      musicPlayIcon.setAttribute("data-lucide", "play");
      musicPlayerMini.classList.remove("playing");
      lucide.createIcons();
    }
  }

  // --- TODO ENGINE (CRUD, Filter, Search, Sort) ---
  
  function handleAddTask(e) {
    e.preventDefault();
    const titleVal = todoInput.value.trim();
    if (!titleVal) return;
    
    const categoryVal = todoCategory.value;
    const dueDateVal = todoDueDate.value;
    
    // Read selected priority
    const priorityVal = document.querySelector('input[name="priority"]:checked').value;
    
    const newTodo = {
      id: Date.now().toString(),
      title: titleVal,
      completed: false,
      priority: priorityVal,
      category: categoryVal,
      dueDate: dueDateVal,
      notes: "",
      subtasks: [],
      createdAt: new Date().toISOString()
    };
    
    todos.push(newTodo);
    todoInput.value = "";
    todoDueDate.value = "";
    
    saveToStorageSecurely();
    renderTodos();
  }

  function toggleTodoComplete(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      if (todo.completed) {
        playSynthNotification("success");
      }
      saveToStorageSecurely();
      renderTodos();
    }
  }

  function deleteTodoItem(id) {
    todos = todos.filter(t => t.id !== id);
    saveToStorageSecurely();
    renderTodos();
  }

  function updateTodoNotes(id, text) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
      todo.notes = text;
      saveToStorageSecurely();
    }
  }

  // Subtasks
  function addSubtask(todoId, text) {
    const todo = todos.find(t => t.id === todoId);
    if (todo && text.trim()) {
      todo.subtasks.push({
        id: Date.now().toString(),
        title: text.trim(),
        completed: false
      });
      saveToStorageSecurely();
      renderTodos();
    }
  }

  function toggleSubtaskComplete(todoId, subtaskId) {
    const todo = todos.find(t => t.id === todoId);
    if (todo) {
      const sub = todo.subtasks.find(s => s.id === subtaskId);
      if (sub) {
        sub.completed = !sub.completed;
        saveToStorageSecurely();
        renderTodos();
      }
    }
  }

  function deleteSubtask(todoId, subtaskId) {
    const todo = todos.find(t => t.id === todoId);
    if (todo) {
      todo.subtasks = todo.subtasks.filter(s => s.id !== subtaskId);
      saveToStorageSecurely();
      renderTodos();
    }
  }

  // Edit Task Title
  function startEditTodoTitle(spanElement, todoId) {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;

    const currentText = todo.title;
    const input = document.createElement("input");
    input.type = "text";
    input.value = currentText;
    input.className = "edit-input";
    input.style.width = "100%";
    input.style.padding = "4px 8px";
    input.style.border = "1px solid var(--btn-primary-bg)";
    input.style.borderRadius = "4px";
    input.style.fontFamily = "var(--font-body)";
    input.style.fontSize = "15px";
    input.style.background = "var(--input-bg)";
    input.style.color = "var(--text-primary)";
    
    spanElement.replaceWith(input);
    input.focus();

    const saveEdit = () => {
      const newTitle = input.value.trim();
      if (newTitle && newTitle !== currentText) {
        todo.title = newTitle;
        saveToStorageSecurely();
      }
      renderTodos();
    };

    input.addEventListener("blur", saveEdit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        saveEdit();
      } else if (e.key === "Escape") {
        renderTodos();
      }
    });
  }

  // --- RENDERING & RENDER PIPELINE ---
  let activeFilter = "all";

  function getSortedAndFilteredTodos() {
    const searchVal = todoSearchInput.value.toLowerCase();
    
    // 1. Filter
    let result = todos.filter(todo => {
      const matchesSearch = todo.title.toLowerCase().includes(searchVal) || 
                            todo.notes.toLowerCase().includes(searchVal);
      
      let matchesTab = true;
      if (activeFilter === "active") matchesTab = !todo.completed;
      if (activeFilter === "completed") matchesTab = todo.completed;
      
      return matchesSearch && matchesTab;
    });
    
    // 2. Sort
    const sortVal = todoSortSelect.value;
    result.sort((a, b) => {
      if (sortVal === "date-created-desc") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortVal === "date-created-asc") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sortVal === "due-date-asc") {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (sortVal === "priority-desc") {
        const priorityWeight = { High: 3, Medium: 2, Low: 1 };
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      return 0;
    });

    return result;
  }

  function renderTodos() {
    const listTodos = getSortedAndFilteredTodos();
    todoList.innerHTML = "";
    
    listTodos.forEach(todo => {
      const li = document.createElement("li");
      li.className = `todo-card glass-panel priority-${todo.priority} ${todo.completed ? "completed" : ""}`;
      li.setAttribute("data-id", todo.id);
      
      // Calculate due date status badge
      let dueBadgeHtml = "";
      if (todo.dueDate) {
        const todayStr = new Date().toISOString().split("T")[0];
        const dueStr = todo.dueDate;
        
        const todayTime = new Date(todayStr).getTime();
        const dueTime = new Date(dueStr).getTime();
        const diffDays = Math.ceil((dueTime - todayTime) / (1000 * 60 * 60 * 24));
        
        let dueClass = "";
        let dueLabel = "";
        
        if (diffDays < 0) {
          dueClass = "overdue";
          dueLabel = `Overdue (${Math.abs(diffDays)}d ago)`;
        } else if (diffDays === 0) {
          dueClass = "today";
          dueLabel = "Today";
        } else if (diffDays === 1) {
          dueLabel = "Tomorrow";
        } else {
          dueLabel = `In ${diffDays} days`;
        }
        
        dueBadgeHtml = `<span class="badge badge-due ${dueClass}"><i data-lucide="calendar"></i> ${dueLabel}</span>`;
      }
      
      // Categories icon map
      const categoryIconMap = {
        Personal: "📁",
        Work: "💼",
        Shopping: "🛒",
        Health: "❤️",
        Ideas: "💡"
      };
      const catIcon = categoryIconMap[todo.category] || "📁";
      
      // Subtask progress info
      const subtaskCount = todo.subtasks.length;
      const completedSubtaskCount = todo.subtasks.filter(s => s.completed).length;
      let subtasksProgressHtml = "";
      if (subtaskCount > 0) {
        subtasksProgressHtml = `<span class="badge badge-category"><i data-lucide="list-todo"></i> ${completedSubtaskCount}/${subtaskCount} Subtasks</span>`;
      }

      li.innerHTML = `
        <div class="todo-card-main">
          <label class="checkbox-container">
            <input type="checkbox" class="todo-toggle-checkbox" ${todo.completed ? "checked" : ""}>
            <span class="checkmark"></span>
          </label>
          
          <div class="todo-card-text-container" style="flex: 1; margin-left: 12px; cursor: pointer;">
            <span class="todo-card-text">${todo.title}</span>
            <div class="todo-meta-badges" style="margin-top: 6px;">
              <span class="badge badge-category">${catIcon} ${todo.category}</span>
              ${dueBadgeHtml}
              ${subtasksProgressHtml}
            </div>
          </div>
          
          <div class="todo-actions-right">
            <button class="icon-btn toggle-expand-btn" title="Toggle detailed view">
              <i data-lucide="chevron-down" class="expand-icon"></i>
            </button>
            <button class="icon-btn delete-todo-btn" title="Delete task">
              <i data-lucide="trash-2" style="color: var(--color-high);"></i>
            </button>
          </div>
        </div>
        
        <div class="todo-details-section">
          <div class="details-grid">
            <div class="notes-block">
              <h4>Notes / Description</h4>
              <textarea class="todo-notes-textarea" placeholder="Add detailed notes here...">${todo.notes || ""}</textarea>
            </div>
            
            <div class="subtasks-block">
              <h4>Checklist</h4>
              <ul class="subtasks-list">
                ${todo.subtasks.map(sub => `
                  <li class="subtask-item ${sub.completed ? "completed" : ""}" data-sub-id="${sub.id}">
                    <label>
                      <input type="checkbox" class="subtask-toggle" ${sub.completed ? "checked" : ""}>
                      <span>${sub.title}</span>
                    </label>
                    <button class="subtask-delete-btn"><i data-lucide="x" style="width: 12px; height: 12px;"></i></button>
                  </li>
                `).join("")}
              </ul>
              
              <form class="add-subtask-form">
                <input type="text" class="subtask-input" placeholder="New checkpoint..." required>
                <button type="submit" class="btn btn-primary"><i data-lucide="plus" style="width: 10px; height: 10px;"></i></button>
              </form>
            </div>
          </div>
        </div>
      `;
      
      // Events mapping inside lists
      // Toggle expanded class
      const textContainer = li.querySelector(".todo-card-text-container");
      const expandBtn = li.querySelector(".toggle-expand-btn");
      const expandIcon = li.querySelector(".expand-icon");
      
      const toggleExpand = () => {
        const isExpanded = li.classList.toggle("expanded");
        if (isExpanded) {
          expandIcon.setAttribute("data-lucide", "chevron-up");
        } else {
          expandIcon.setAttribute("data-lucide", "chevron-down");
        }
        lucide.createIcons();
      };
      
      textContainer.addEventListener("click", toggleExpand);
      expandBtn.addEventListener("click", toggleExpand);
      
      // Edit Title Double Click
      const textSpan = li.querySelector(".todo-card-text");
      textSpan.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        startEditTodoTitle(textSpan, todo.id);
      });
      
      // Checkbox complete toggle
      const checkbox = li.querySelector(".todo-toggle-checkbox");
      checkbox.addEventListener("change", () => toggleTodoComplete(todo.id));
      
      // Delete todo
      const deleteBtn = li.querySelector(".delete-todo-btn");
      deleteBtn.addEventListener("click", () => deleteTodoItem(todo.id));
      
      // Notes Blur Auto Save
      const notesTextarea = li.querySelector(".todo-notes-textarea");
      notesTextarea.addEventListener("blur", () => {
        updateTodoNotes(todo.id, notesTextarea.value);
      });
      
      // Subtasks triggers
      const subtaskList = li.querySelector(".subtasks-list");
      subtaskList.addEventListener("change", (e) => {
        if (e.target.classList.contains("subtask-toggle")) {
          const subLi = e.target.closest(".subtask-item");
          const subId = subLi.getAttribute("data-sub-id");
          toggleSubtaskComplete(todo.id, subId);
        }
      });
      
      subtaskList.addEventListener("click", (e) => {
        const delBtn = e.target.closest(".subtask-delete-btn");
        if (delBtn) {
          const subLi = delBtn.closest(".subtask-item");
          const subId = subLi.getAttribute("data-sub-id");
          deleteSubtask(todo.id, subId);
        }
      });
      
      // Add subtask
      const addSubForm = li.querySelector(".add-subtask-form");
      addSubForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = addSubForm.querySelector(".subtask-input");
        addSubtask(todo.id, input.value);
        input.value = "";
      });

      todoList.appendChild(li);
    });

    lucide.createIcons();
    updateAnalytics();
  }

  // --- ANALYTICS PIPELINE ---
  function updateAnalytics() {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const pending = total - completed;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Stats elements text updates
    statsTotal.textContent = total;
    statsCompleted.textContent = completed;
    statsPending.textContent = pending;
    
    statsRadialPercent.textContent = `${percent}%`;
    
    // Radial offset calculation: circumference = 251.2 (for r=40)
    // offset = 251.2 * (1 - percent/100)
    const offset = 251.2 * (1 - percent / 100);
    statsRadialBar.style.strokeDashoffset = offset;
  }

  // --- WIDGETS MANAGER ---
  function initWidgets() {
    loadWeather();
    loadQuote();
    resetPomoTimer();
  }

  // 1. WEATHER INTEGRATION (Open-Meteo with dynamic lookup & mock fallback)
  async function loadWeather(cityName = settings.weatherCity) {
    weatherContent.innerHTML = `<div class="weather-loading">Contacting sky forecasting...</div>`;
    
    try {
      // 1. Geocode city
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();
      
      if (geoData.results && geoData.results.length > 0) {
        const cityObj = geoData.results[0];
        const lat = cityObj.latitude;
        const lon = cityObj.longitude;
        const displayName = cityObj.name;
        
        // Save back to settings
        settings.weatherCity = displayName;
        weatherCityInput.value = displayName;
        
        // 2. Fetch current weather
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();
        
        if (weatherData.current_weather) {
          const temp = Math.round(weatherData.current_weather.temperature);
          const wind = Math.round(weatherData.current_weather.windspeed);
          const weatherCode = weatherData.current_weather.weathercode;
          
          renderWeatherData(displayName, temp, wind, weatherCode);
          return;
        }
      }
      throw new Error("City not found or API limits exceeded.");
    } catch (err) {
      console.warn("Weather API call failed. Falling back to local forecast generator.", err);
      generateFallbackWeather(cityName);
    }
  }

  function renderWeatherData(city, temp, wind, code) {
    // Map Open-Meteo codes to icons
    // 0: Clear sky, 1-3: Partly cloudy, 45-48: Fog, 51-67: Rain/drizzle, 71-77: Snow, 80-82: Showers, 95-99: Thunderstorm
    let icon = "sun";
    let desc = "Clear Skies";
    
    if (code === 0) { icon = "sun"; desc = "Clear"; }
    else if (code >= 1 && code <= 3) { icon = "cloud-sun"; desc = "Partly Cloudy"; }
    else if (code >= 45 && code <= 48) { icon = "cloud-fog"; desc = "Foggy"; }
    else if (code >= 51 && code <= 67) { icon = "cloud-drizzle"; desc = "Rainy"; }
    else if (code >= 71 && code <= 77) { icon = "cloud-snow"; desc = "Snowy"; }
    else if (code >= 80 && code <= 82) { icon = "cloud-rain"; desc = "Showers"; }
    else if (code >= 95 && code <= 99) { icon = "cloud-lightning"; desc = "Stormy"; }
    
    weatherContent.innerHTML = `
      <div class="weather-info">
        <div class="weather-temp-box">
          <span class="weather-temp">${temp}°C</span>
          <span class="weather-city">${city}</span>
        </div>
        <div class="weather-icon-box">
          <i data-lucide="${icon}" style="width: 42px; height: 42px;"></i>
        </div>
      </div>
      <div class="weather-details">
        <div class="weather-details-item"><i data-lucide="wind"></i> <span>${wind} km/h</span></div>
        <div class="weather-details-item"><i data-lucide="info"></i> <span>${desc}</span></div>
      </div>
    `;
    lucide.createIcons();
  }

  // Generates offline simulated weather based on hour of day
  function generateFallbackWeather(city) {
    const today = new Date();
    const hour = today.getHours();
    
    // Standard mock algorithm using city name length & hour to determine temp/status
    const seed = city.length + hour;
    const temp = 15 + (seed % 15); // 15 to 30 C
    const wind = 5 + (seed % 20); // 5 to 25 km/h
    
    const codes = [0, 2, 61, 80]; // sun, cloud-sun, rain, showers
    const code = codes[seed % codes.length];
    
    renderWeatherData(city, temp, wind, code);
  }

  // 2. DAILY QUOTES WIDGET (With fallback list)
  const LOCAL_QUOTES = [
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { text: "Don't count the days, make the days count.", author: "Muhammad Ali" },
    { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
    { text: "Clean code always looks like it was written by someone who cares.", author: "Robert C. Martin" },
    { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
    { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
    { text: "Before software can be reusable it first has to be usable.", author: "Ralph Johnson" },
    { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
    { text: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.", author: "Stephen King" }
  ];

  async function loadQuote() {
    quoteText.textContent = "Seeking motivation...";
    quoteAuthor.textContent = "";
    
    try {
      const res = await fetch("https://dummyjson.com/quotes/random");
      if (res.ok) {
        const data = await res.json();
        quoteText.textContent = `"${data.quote}"`;
        quoteAuthor.textContent = `— ${data.author}`;
        return;
      }
      throw new Error();
    } catch (e) {
      // Fallback
      const randomIndex = Math.floor(Math.random() * LOCAL_QUOTES.length);
      const quote = LOCAL_QUOTES[randomIndex];
      quoteText.textContent = `"${quote.text}"`;
      quoteAuthor.textContent = `— ${quote.author}`;
    }
  }

  // 3. POMODORO TIMER WIDGET (SVG Countdown)
  let pomoTimerId = null;
  let pomoTimeLeft = 25 * 60;
  let pomoTotalDuration = 25 * 60;
  let pomoActiveMode = "work"; // work, short, long

  function setPomoMode(mode) {
    pomoActiveMode = mode;
    pomoModeBtns.forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-mode") === mode);
    });
    
    if (mode === "work") {
      pomoTotalDuration = 25 * 60;
    } else if (mode === "short") {
      pomoTotalDuration = 5 * 60;
    } else if (mode === "long") {
      pomoTotalDuration = 15 * 60;
    }
    
    stopPomoTimer();
    resetPomoTimer();
  }

  function resetPomoTimer() {
    pomoTimeLeft = pomoTotalDuration;
    updatePomoUI();
  }

  function startPomoTimer() {
    if (pomoTimerId) {
      stopPomoTimer();
      return;
    }
    
    pomoStartBtn.innerHTML = `<i data-lucide="pause"></i> Pause`;
    pomoStartBtn.classList.remove("btn-primary");
    pomoStartBtn.classList.add("btn-secondary");
    lucide.createIcons();
    
    pomoTimerId = setInterval(() => {
      pomoTimeLeft--;
      updatePomoUI();
      
      if (pomoTimeLeft <= 0) {
        clearInterval(pomoTimerId);
        pomoTimerId = null;
        playSynthNotification("pomo");
        
        if (pomoActiveMode === "work") {
          pomoCount++;
          settings.pomoCount = pomoCount;
          saveToStorageSecurely();
          pomoCountDisplay.textContent = `Completed: ${pomoCount}`;
          alert("Work session finished! Time to take a break.");
          setPomoMode("short");
        } else {
          alert("Break session finished! Back to work.");
          setPomoMode("work");
        }
      }
    }, 1000);
  }

  function stopPomoTimer() {
    if (pomoTimerId) {
      clearInterval(pomoTimerId);
      pomoTimerId = null;
    }
    pomoStartBtn.innerHTML = `<i data-lucide="play"></i> Start`;
    pomoStartBtn.classList.remove("btn-secondary");
    pomoStartBtn.classList.add("btn-primary");
    lucide.createIcons();
  }

  function updatePomoUI() {
    const mins = Math.floor(pomoTimeLeft / 60);
    const secs = pomoTimeLeft % 60;
    pomoTimeDisplay.textContent = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    
    // SVG radial ring calculations
    // Circumference = 339.3 (r=54)
    // stroke-dashoffset = 339.3 * (1 - ratio)
    const ratio = pomoTimeLeft / pomoTotalDuration;
    const offset = 339.3 * (1 - ratio);
    pomoProgressRing.style.strokeDashoffset = offset;
  }

  // --- IMPORT / EXPORT / DATA MANAGEMENT ---
  async function exportTodos() {
    if (!sessionPassword) return;
    
    // Ask user if they want encrypted or decrypted export
    const encryptExport = confirm("Do you want to export ENCRYPTED data? (Requires your master password to import on another device). Click Cancel to export plain text JSON.");
    
    let fileContent = "";
    let fileName = "";
    
    if (encryptExport) {
      const payload = {
        secured_todos: localStorage.getItem("secured_todos"),
        secured_verifier: localStorage.getItem("secured_verifier"),
        secured_settings: localStorage.getItem("secured_settings")
      };
      fileContent = JSON.stringify(payload, null, 2);
      fileName = "aether_todos_encrypted.json";
    } else {
      fileContent = JSON.stringify(todos, null, 2);
      fileName = "aether_todos_plain.json";
    }
    
    const blob = new Blob([fileContent], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
  }

  function importTodos() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.addEventListener("change", async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          
          // Check if file is encrypted payload or plain todo array
          if (data.secured_verifier && data.secured_todos) {
            // Encrypted format. Must import entire database state
            if (confirm("This is an encrypted database backup. Importing it will completely overwrite your current passwords, tasks, and settings. Continue?")) {
              localStorage.setItem("secured_verifier", data.secured_verifier);
              localStorage.setItem("secured_todos", data.secured_todos);
              if (data.secured_settings) {
                localStorage.setItem("secured_settings", data.secured_settings);
              }
              alert("Encrypted database restored. The app will now lock. Use the password from the imported backup to unlock.");
              lockApp();
            }
          } else if (Array.isArray(data)) {
            // Plain task list
            if (confirm(`Do you want to append ${data.length} tasks to your active workspace?`)) {
              // Basic structure validation
              const parsedTasks = data.map(item => ({
                id: item.id || Date.now().toString() + Math.random().toString(36).substring(2, 5),
                title: item.title || (typeof item === 'string' ? item : "Untitled Task"),
                completed: !!item.completed,
                priority: item.priority || "Low",
                category: item.category || "Personal",
                dueDate: item.dueDate || "",
                notes: item.notes || "",
                subtasks: Array.isArray(item.subtasks) ? item.subtasks : [],
                createdAt: item.createdAt || new Date().toISOString()
              }));
              
              todos = [...todos, ...parsedTasks];
              await saveToStorageSecurely();
              renderTodos();
              alert("Tasks imported successfully!");
            }
          } else {
            alert("Unrecognized JSON format. File must be a plain task list array or secure AetherTodo backup.");
          }
        } catch (err) {
          alert("Failed to parse file. Ensure it is a valid JSON file.");
        }
      };
      reader.readAsText(file);
    });
    input.click();
  }

  // --- ATTACH EVENT LISTENERS ---
  
  // Auth screen
  setupForm.addEventListener("submit", handleSetup);
  unlockForm.addEventListener("submit", handleUnlock);
  resetWorkspaceLink.addEventListener("click", (e) => {
    e.preventDefault();
    hardResetDatabase();
  });
  
  // Top nav
  themeToggle.addEventListener("click", toggleTheme);
  manualLockBtn.addEventListener("click", lockApp);
  musicPlayBtn.addEventListener("click", toggleMusic);
  
  musicVolume.addEventListener("input", (e) => {
    bgAudio.volume = e.target.value;
  });

  // Todo form submission
  todoFormElement.addEventListener("submit", handleAddTask);
  
  // Search and Sort
  todoSearchInput.addEventListener("input", renderTodos);
  todoSortSelect.addEventListener("change", renderTodos);
  
  // Filter tabs
  filterTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      filterTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      activeFilter = tab.getAttribute("data-filter");
      renderTodos();
    });
  });

  // Pomodoro
  pomoStartBtn.addEventListener("click", startPomoTimer);
  pomoResetBtn.addEventListener("click", resetPomoTimer);
  pomoModeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      setPomoMode(btn.getAttribute("data-mode"));
    });
  });

  // Weather Search
  weatherSearchBtn.addEventListener("click", () => {
    const city = weatherCityInput.value.trim();
    if (city) {
      loadWeather(city);
      settings.weatherCity = city;
      saveToStorageSecurely();
    }
  });
  
  weatherCityInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const city = weatherCityInput.value.trim();
      if (city) {
        loadWeather(city);
        settings.weatherCity = city;
        saveToStorageSecurely();
      }
    }
  });

  // Quote
  newQuoteBtn.addEventListener("click", loadQuote);

  // Footer Actions
  autolockSelect.addEventListener("change", (e) => {
    settings.autoLockSeconds = parseInt(e.target.value);
    saveToStorageSecurely();
    resetInactivityTimer();
  });
  
  exportTodosBtn.addEventListener("click", exportTodos);
  importTodosBtn.addEventListener("click", importTodos);
  wipeDataBtn.addEventListener("click", hardResetDatabase);

  // Toggle form options details
  toggleDetailsBtn.addEventListener("click", () => {
    formDetailsCollapse.classList.toggle("expanded");
    const isExpanded = formDetailsCollapse.classList.contains("expanded");
    toggleDetailsBtn.querySelector("span").textContent = isExpanded ? "Simple View" : "Advanced Options";
  });

  // --- BOOTSTRAP INITIALIZATION ---
  window.addEventListener("DOMContentLoaded", () => {
    checkFirstLaunch();
    lucide.createIcons();
  });

})();
