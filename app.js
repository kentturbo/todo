const todoInput = document.querySelector("#todo-input");
const addTodoBtn = document.querySelector("#add-todo");
const todoList = document.querySelector("#todo-list");
const exportTodosBtn = document.querySelector("#export-todos");
const importTodosBtn = document.querySelector("#import-todos");

let todos = JSON.parse(localStorage.getItem("todos")) || [];

const renderTodos = () => {
  todoList.innerHTML = "";
  todos.forEach((todo, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="todo-item">${todo}</span> 
      <!-- <button class="edit-todo" data-index="${index}"></button> -->
      <button class="delete-todo"><svg stroke="currentColor" fill="none" data-index="${index}" class="delete-todo-ico" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
    `;
    todoList.appendChild(li);
  });
};

const addTodo = (event) => {
  event.preventDefault();
  const todo = todoInput.value;
  todos.push(todo);
  todoInput.value = "";
  renderTodos();
  localStorage.setItem("todos", JSON.stringify(todos));
};

const deleteTodo = (event) => {
  if (event.target.classList.contains("delete-todo-ico")) {
    const index = event.target.dataset.index;
    todos.splice(index, 1);
    renderTodos();
    localStorage.setItem("todos", JSON.stringify(todos));
  }
};

function editTodo(event) {
  if (event.target.tagName === "SPAN") {
    const todo = event.target;
    const textarea = document.createElement("textarea");
    textarea.value = todo.textContent;
    textarea.style.display = "block";
    textarea.classList.add = "edit_textarea";
    textarea.style.marginBottom = "0.2em";
    todo.replaceWith(textarea);
    textarea.focus();
    

    textarea.addEventListener("blur", function () {
      if (textarea.value) {
        const editedTodo = document.createElement("span");
        editedTodo.textContent = textarea.value;
        editedTodo.style.display = "block";
        textarea.replaceWith(editedTodo);
        todos[todos.indexOf(todo.textContent)] = textarea.value;
        localStorage.setItem("todos", JSON.stringify(todos));
      }
    });
  }
}

todoList.addEventListener("click", editTodo);



const exportTodos = () => {
  const data = JSON.stringify(todos);
  const a = document.createElement("a");
  const blob = new Blob([data], {
    type: "application/json"
  });
  a.href = URL.createObjectURL(blob);
  a.download = "todos.json";
  a.click();
};

const importTodos = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.addEventListener("change", (event) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      todos = JSON.parse(event.target.result);
      renderTodos();
      localStorage.setItem("todos", JSON.stringify(todos));
    };
    reader.readAsText(event.target.files[0]);
  });
  input.click();
};

addTodoBtn.addEventListener("click", addTodo);
todoList.addEventListener("click", deleteTodo);
todoList.addEventListener("click", editTodo);
exportTodosBtn.addEventListener("click", exportTodos);
importTodosBtn.addEventListener("click", importTodos);


renderTodos();