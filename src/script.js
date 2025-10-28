import "./style.css";

class StorageManager {
  constructor() {
    this.STORAGE_KEY = "focusflow_data";
  }

  save(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
    }
  }

  load() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Failed to load from localStorage:", error);
      return null;
    }
  }

  clear() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

class TaskManager {
  constructor() {
    this.projects = [];
    this.selectedProjectId = null;
    this.currentView = "today";
    this.streakCount = 0;
  }

  setData(data) {
    this.projects = data.projects || [];
    this.selectedProjectId = data.selectedProjectId || null;
    this.currentView = data.currentView || "today";
    this.streakCount = data.streakCount || 0;
  }

  getData() {
    return {
      projects: this.projects,
      selectedProjectId: this.selectedProjectId,
      currentView: this.currentView,
      streakCount: this.streakCount,
    };
  }

  createDefaultProject() {
    const defaultProject = {
      id: "default",
      name: "Personal Tasks",
      icon: "📝",
      color: "#3B82F6",
      createdAt: Date.now(),
      tasks: [],
      stats: {
        total: 0,
        completed: 0,
        inProgress: 0,
        overdue: 0,
      },
    };
    this.projects.push(defaultProject);
    this.selectedProjectId = "default";
  }

  createProject(name) {
    const newProject = {
      id: `project_${Date.now()}`,
      name: name,
      icon: this.getRandomIcon(),
      color: this.getRandomColor(),
      createdAt: Date.now(),
      tasks: [],
      stats: {
        total: 0,
        completed: 0,
        inProgress: 0,
        overdue: 0,
      },
    };
    this.projects.push(newProject);
    this.selectedProjectId = newProject.id;
  }

  createTask(taskData) {
    const selectedProject = this.getSelectedProject();
    if (!selectedProject) return;

    const newTask = {
      id: `task_${Date.now()}`,
      title: taskData.title,
      description: "",
      dueDate: taskData.dueDate,
      estimatedTime: taskData.estimatedTime,
      category: taskData.category,
      priority: taskData.priority,
      status: "todo",
      progress: 0,
      tags: [],
      checklist: [],
      completedAt: null,
      createdAt: Date.now(),
      projectId: selectedProject.id,
    };

    selectedProject.tasks.push(newTask);
    this.updateProjectStats(selectedProject.id);
  }

  toggleTaskComplete(taskId) {
    const task = this.findTaskById(taskId);
    if (task) {
      task.status = task.status === "done" ? "todo" : "done";
      task.completedAt = task.status === "done" ? Date.now() : null;

      if (task.status === "done") {
        this.streakCount++;
      }

      this.updateProjectStats(task.projectId);
    }
  }

  deleteTask(taskId) {
    const project = this.getProjectByTaskId(taskId);
    if (project) {
      project.tasks = project.tasks.filter((task) => task.id !== taskId);
      this.updateProjectStats(project.id);
    }
  }

  selectProject(projectId) {
    this.selectedProjectId = projectId;
  }

  setView(view) {
    this.currentView = view;
  }

  getSelectedProject() {
    return this.projects.find(
      (project) => project.id === this.selectedProjectId
    );
  }

  findTaskById(taskId) {
    for (const project of this.projects) {
      const task = project.tasks.find((task) => task.id === taskId);
      if (task) return task;
    }
    return null;
  }

  getProjectByTaskId(taskId) {
    for (const project of this.projects) {
      if (project.tasks.some((task) => task.id === taskId)) {
        return project;
      }
    }
    return null;
  }

  getState() {
    const selectedProject = this.getSelectedProject();
    let tasksToShow = [];

    if (this.currentView === "today") {
      tasksToShow = this.getTodayTasks();
    } else if (this.currentView === "upcoming") {
      tasksToShow = this.getUpcomingTasks();
    } else if (this.currentView === "completed") {
      tasksToShow = this.getCompletedTasks();
    } else {
      tasksToShow = selectedProject ? selectedProject.tasks : [];
    }

    return {
      projects: this.projects,
      selectedProject: selectedProject,
      currentView: this.currentView,
      tasks: tasksToShow,
      streakCount: this.streakCount,
    };
  }

  getTodayTasks() {
    const today = new Date().toISOString().split("T")[0];
    return this.getAllTasks().filter((task) => task.dueDate === today);
  }

  getUpcomingTasks() {
    const today = new Date().toISOString().split("T")[0];
    return this.getAllTasks().filter(
      (task) => task.dueDate && task.dueDate > today
    );
  }

  getCompletedTasks() {
    return this.getAllTasks().filter((task) => task.status === "done");
  }

  getAllTasks() {
    let allTasks = [];
    this.projects.forEach((project) => {
      allTasks = allTasks.concat(project.tasks);
    });
    return allTasks;
  }

  updateProjectStats(projectId) {
    const project = this.projects.find((p) => p.id === projectId);
    if (!project) return;

    project.stats = {
      total: project.tasks.length,
      completed: project.tasks.filter((t) => t.status === "done").length,
      inProgress: project.tasks.filter((t) => t.status === "in-progress")
        .length,
      overdue: this.getOverdueCount(project.tasks),
    };
  }

  getOverdueCount(tasks) {
    const today = new Date().toISOString().split("T")[0];
    return tasks.filter(
      (task) => task.dueDate && task.dueDate < today && task.status !== "done"
    ).length;
  }

  getRandomIcon() {
    const icons = ["🏠", "💼", "💪", "🎨", "📚", "🎯", "💡", "🛠️"];
    return icons[Math.floor(Math.random() * icons.length)];
  }

  getRandomColor() {
    const colors = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6"];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

class UIController {
  constructor() {
    this.taskTemplate = document.getElementById("task-card-template");
    this.projectTemplate = document.getElementById("project-item-template");
  }

  init(taskManager) {
    this.setupTaskForm();
    this.setupSearch();
  }

  setupTaskForm() {
    const openButton = document.querySelector("[data-new-task-button]");
    const formPanel = document.querySelector("[data-task-form-panel]");
    const closeButton = document.querySelector("[data-close-form]");

    openButton?.addEventListener("click", () => {
      formPanel.style.display = "block";
    });

    closeButton?.addEventListener("click", () => {
      formPanel.style.display = "none";
    });
  }

  setupSearch() {
    const searchInput = document.querySelector("[data-search-input]");
    searchInput?.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase();
      // Implement search filtering here
    });
  }

  render(state) {
    this.renderProjects(state.projects, state.selectedProject?.id);
    this.renderProjectHeader(state.selectedProject, state.currentView);
    this.renderTasks(state.tasks);
    this.renderStats(state);
  }

  renderProjects(projects, selectedProjectId) {
    const container = document.querySelector("[data-projects]");
    if (!container) return;

    container.innerHTML = "";

    projects.forEach((project) => {
      const projectElement = document.importNode(
        this.projectTemplate.content,
        true
      );

      const projectItem = projectElement.querySelector("[data-project-item]");
      projectItem.dataset.projectId = project.id;

      projectElement.querySelector("[data-project-name]").textContent =
        project.name;
      projectElement.querySelector("[data-project-icon]").textContent =
        project.icon;

      const progressPercent =
        project.stats.total > 0
          ? Math.round((project.stats.completed / project.stats.total) * 100)
          : 0;

      projectElement.querySelector(
        "[data-project-progress]"
      ).textContent = `${progressPercent}%`;
      projectElement.querySelector(
        "[data-project-task-count]"
      ).textContent = `${project.stats.completed}/${project.stats.total}`;

      if (project.id === selectedProjectId) {
        projectItem.classList.add("active");
      }

      container.appendChild(projectElement);
    });
  }

  renderProjectHeader(selectedProject, currentView) {
    const titleElement = document.querySelector("[data-project-title]");
    const statsElement = document.querySelector("[data-project-stats]");

    if (!titleElement || !statsElement) return;

    if (selectedProject) {
      titleElement.textContent = selectedProject.name;

      const progressPercent =
        selectedProject.stats.total > 0
          ? Math.round(
              (selectedProject.stats.completed / selectedProject.stats.total) *
                100
            )
          : 0;

      const progressFill = statsElement.querySelector(".progress-fill");
      if (progressFill) {
        progressFill.style.width = `${progressPercent}%`;
      }

      const statsText = statsElement.querySelector(".stats-text");
      if (statsText) {
        statsText.textContent = `${selectedProject.stats.completed}/${selectedProject.stats.total} tasks completed`;
      }
    } else {
      titleElement.textContent = "No project selected";
      const statsText = statsElement.querySelector(".stats-text");
      if (statsText) {
        statsText.textContent = "0/0 tasks completed";
      }
    }
  }

  renderTasks(tasks) {
    const container = document.querySelector("[data-tasks-grid]");
    const emptyState = document.querySelector("[data-empty-state]");

    if (!container) return;

    if (tasks.length === 0) {
      emptyState.style.display = "block";
      container.innerHTML = "";
      return;
    }

    emptyState.style.display = "none";
    container.innerHTML = "";

    tasks.forEach((task) => {
      const taskElement = document.importNode(this.taskTemplate.content, true);

      const card = taskElement.querySelector("[data-task-card]");
      card.dataset.taskId = task.id;

      taskElement.querySelector("[data-task-title]").textContent = task.title;
      taskElement.querySelector("[data-task-category]").textContent =
        task.category;
      taskElement.querySelector(
        "[data-task-time]"
      ).textContent = `${task.estimatedTime}min`;

      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        const isOverdue = dueDate < today && task.status !== "done";

        taskElement.querySelector("[data-task-due]").textContent =
          dueDate.toLocaleDateString();

        if (isOverdue) {
          card.classList.add("overdue");
        }
      }

      const checkbox = taskElement.querySelector("[data-task-complete]");
      checkbox.checked = task.status === "done";

      const priorityBadge = taskElement.querySelector(".priority-badge");
      priorityBadge.className = `priority-badge ${task.priority}`;
      priorityBadge.textContent =
        task.priority.charAt(0).toUpperCase() + task.priority.slice(1);

      container.appendChild(taskElement);
    });
  }

  renderStats(state) {
    const streakElement = document.querySelector(".streak-number");
    if (streakElement) {
      streakElement.textContent = state.streakCount;
    }

    const completedElement = document.querySelector(".completed-count");
    const totalElement = document.querySelector(".total-count");
    if (completedElement && totalElement) {
      const completed = state.tasks.filter((t) => t.status === "done").length;
      const total = state.tasks.length;
      completedElement.textContent = completed;
      totalElement.textContent = total;
    }
  }
}

class App {
  constructor() {
    this.taskManager = new TaskManager();
    this.uiController = new UIController();
    this.storageManager = new StorageManager();

    this.initializeApp();
  }

  initializeApp() {
    const savedData = this.storageManager.load();
    if (savedData) {
      this.taskManager.setData(savedData);
    } else {
      this.taskManager.createDefaultProject();
    }

    this.uiController.init(this.taskManager);
    this.setupEventListeners();
    this.render();
  }

  setupEventListeners() {
    document
      .querySelector("[data-new-project-form]")
      .addEventListener("submit", (e) => {
        e.preventDefault();
        const input = document.querySelector("[data-new-project-input]");
        const projectName = input.value.trim();
        if (projectName) {
          this.taskManager.createProject(projectName);
          input.value = "";
          this.saveAndRender();
        }
      });

    document
      .querySelector("[data-task-form]")
      .addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleTaskCreation();
      });

    document.addEventListener("change", (e) => {
      if (e.target.classList.contains("task-checkbox")) {
        const taskId = e.target.closest("[data-task-card]").dataset.taskId;
        this.taskManager.toggleTaskComplete(taskId);
        this.saveAndRender();
      }
    });

    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-delete-task]")) {
        const taskId = e.target.closest("[data-task-card]").dataset.taskId;
        this.taskManager.deleteTask(taskId);
        this.saveAndRender();
      }
    });

    document.addEventListener("click", (e) => {
      const projectItem = e.target.closest("[data-project-item]");
      if (projectItem) {
        const projectId = projectItem.dataset.projectId;
        this.taskManager.selectProject(projectId);
        this.render();
      }
    });

    document.addEventListener("click", (e) => {
      const navItem = e.target.closest("[data-nav]");
      if (navItem) {
        const view = navItem.dataset.nav;
        this.taskManager.setView(view);
        this.render();
      }
    });
  }

  handleTaskCreation() {
    const formData = {
      title: document.querySelector("[data-task-title]").value,
      dueDate: document.querySelector("[data-task-due-date]").value,
      estimatedTime: parseInt(document.querySelector("[data-task-time]").value),
      category: document.querySelector("[data-task-category]").value,
      priority: document.querySelector("[data-task-priority]:checked").value,
    };

    if (formData.title.trim()) {
      this.taskManager.createTask(formData);
      this.closeTaskForm();
      this.saveAndRender();
    }
  }

  saveAndRender() {
    this.storageManager.save(this.taskManager.getData());
    this.render();
  }

  render() {
    this.uiController.render(this.taskManager.getState());
  }

  closeTaskForm() {
    const panel = document.querySelector("[data-task-form-panel]");
    panel.style.display = "none";
    document.querySelector("[data-task-form]").reset();
  }
}

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
  new App();
});
