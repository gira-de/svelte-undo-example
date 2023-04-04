<script lang="ts">
  import '@fontsource/material-icons';
  import { undoStack, transactionCtrl } from '@gira-de/svelte-undo';
  import { writable } from 'svelte/store';
  import type { Writable } from 'svelte/store';
  import { flip } from 'svelte/animate';

  type Task = {
    id: string;
    state: string;
    title: string;
  };

  const states = ['backlog', 'progress', 'review', 'done'];
  let tasksStore: Writable<Record<string, Task>> = writable({});

  let taskId = 1;
  function nextId() {
    return `TASK-${taskId++}`;
  }

  // event handlers

  function onNewTaskInputChange(input: HTMLInputElement) {
    if (!input.value) {
      return;
    }

    const task = {
      id: nextId(),
      state: 'backlog',
      title: input.value,
    };
    const draftTasks = transaction.draft(tasksStore);
    draftTasks[task.id] = task;
    transaction.commit(`[${task.id}] added`);
    input.value = '';
  }

  function onTaskTitleChange(task: Task, input: HTMLInputElement) {
    const draftTasks = transaction.draft(tasksStore);
    draftTasks[task.id].title = input.value;
    transaction.commit(`[${task.id}] renamed to '${input.value}'`);
  }

  function onMoveTaskClick(task: Task, state: string) {
    const draftTasks = transaction.draft(tasksStore);
    draftTasks[task.id].state = state;
    transaction.commit(`[${task.id}] moved to ${state}`);
  }

  function onRemoveTaskClick(task: Task) {
    const draftTasks = transaction.draft(tasksStore);
    delete draftTasks[task.id];
    transaction.commit(`[${task.id}] removed`);
  }

  // undo stack
  const myUndoStack = undoStack('board created');
  const transaction = transactionCtrl(myUndoStack);
</script>

<div class="layout">
  <sidebar>
    <menu>
      Undo Steps:
      <div>
        <button
          class="icon"
          on:click={myUndoStack.undo}
          disabled={!$myUndoStack.canUndo}>undo</button
        >
        <button
          class="icon"
          on:click={myUndoStack.redo}
          disabled={!$myUndoStack.canRedo}>redo</button
        >
      </div>
    </menu>

    <ul class="undo-steps">
      {#each $myUndoStack.actions as undoAction}
        {@const isUndoStep =
          undoAction.seqNbr < $myUndoStack.selectedAction.seqNbr}
        {@const isRedoStep =
          undoAction.seqNbr > $myUndoStack.selectedAction.seqNbr}
        {@const isCurrentStep =
          undoAction.seqNbr === $myUndoStack.selectedAction.seqNbr}
        <li
          class:isRedoStep
          class:isCurrentStep
          on:click={() => myUndoStack.goto(undoAction.seqNbr)}
          on:keydown
        >
          <span class="icon">
            {isUndoStep ? 'undo' : isRedoStep ? 'redo' : 'check'}
          </span>
          {undoAction.msg}
        </li>
      {/each}
    </ul>
  </sidebar>

  <div>
    <input
      class="new-task"
      type="text"
      on:change={(e) => onNewTaskInputChange(e.currentTarget)}
      placeholder="create a new task"
    />
    <div class="columns">
      {#each states as state, stateIndex (state)}
        {@const tasks = Object.values($tasksStore).filter(
          (t) => t.state === state,
        )}
        <div class="column">
          <h1>{state}</h1>
          <ul class="tasks">
            {#each tasks as task (task.id)}
              <li animate:flip={{ duration: 200 }}>
                <span class="id">
                  {task.id}
                </span>
                {#if stateIndex > 0}
                  <button
                    class="icon"
                    on:click={() =>
                      onMoveTaskClick(task, states[stateIndex - 1])}
                  >
                    arrow_back
                  </button>
                {/if}
                {#if stateIndex < states.length - 1}
                  <button
                    class="icon"
                    on:click={() =>
                      onMoveTaskClick(task, states[stateIndex + 1])}
                  >
                    arrow_forward
                  </button>
                {/if}
                <input
                  type="text"
                  value={task.title}
                  on:change={(e) => onTaskTitleChange(task, e.currentTarget)}
                />
                <button class="icon" on:click={() => onRemoveTaskClick(task)}>
                  delete
                </button>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .layout {
    display: grid;
    grid-template-columns: 1fr 3fr;
    gap: 2rem;
  }

  menu {
    margin: 0 0 1rem 0;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .columns {
    display: flex;
    gap: 1rem;
  }

  .column {
    flex: 1;
  }

  input.new-task {
    font-size: 1.3rem;
  }

  ul {
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  ul.tasks li {
    position: relative;
    margin-bottom: 1rem;
    padding: 0.2rem;
    background-color: #eee;
    border: 1px solid #ddd;
    border-radius: 2px;
    display: flex;
    align-items: center;
  }

  ul.tasks span.id {
    position: absolute;
    bottom: -0.8rem;
    right: 0;
    font-size: 0.5rem;
    font-family: monospace;
    color: #aaa;
  }

  ul.undo-steps {
    flex-direction: column-reverse;
  }

  ul.undo-steps li {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    cursor: pointer;
  }

  ul.undo-steps li.isRedoStep {
    color: #aaa;
  }

  ul.undo-steps li.isCurrentStep {
    font-weight: bold;
    cursor: default;
  }
</style>
