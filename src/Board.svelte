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

  function snapshotRoundtrip() {
    const snapshot = myUndoStack.createSnapshot({
      taskStore: tasksStore,
    });
    console.log(JSON.stringify(snapshot));
    myUndoStack.loadSnapshot(snapshot, {
      taskStore: tasksStore,
    });
    alert(
      'Undo stack was saved to a snapshot, and then restored from the snapshot',
    );
  }

  function clearUndo() {
    myUndoStack.clearUndo();
  }

  function clearRedo() {
    myUndoStack.clearRedo();
  }
</script>

<div class="layout">
  <sidebar>
    <menu>
      Undo Steps
      <div>
        <button
          class="icon"
          on:click={myUndoStack.undo}
          disabled={!$myUndoStack.canUndo}
          title="undo">undo</button
        >
        <button
          class="icon"
          on:click={myUndoStack.redo}
          disabled={!$myUndoStack.canRedo}
          title="redo">redo</button
        >
      </div>
    </menu>

    <div class="history">
      <ul class="history-list">
        {#each $myUndoStack.actions as undoAction}
          {@const step =
            undoAction.seqNbr < $myUndoStack.selectedAction.seqNbr
              ? 'undo'
              : undoAction.seqNbr > $myUndoStack.selectedAction.seqNbr
                ? 'redo'
                : 'check'}
          <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
          <li
            class:isRedoStep={step === 'redo'}
            class:isCurrentStep={step === 'check'}
            on:click={() => myUndoStack.goto(undoAction.seqNbr)}
            title={step}
          >
            <div>
              <span class="icon">{step}</span>
              {`${undoAction.msg} (${undoAction.seqNbr})`}
            </div>
          </li>
        {/each}
      </ul>
    </div>

    <div class="commands">
      <button on:click={snapshotRoundtrip}
        >Create a snapshot and then load it again</button
      >
      <button on:click={clearUndo}>clearUndo</button>
      <button on:click={clearRedo}>clearRedo</button>
    </div>
  </sidebar>

  <div class="new-task">
    <input
      type="text"
      on:change={(e) => onNewTaskInputChange(e.currentTarget)}
      placeholder="create a new task"
    />
  </div>

  <div class="board">
    <div class="board-columns">
      {#each states as state, stateIndex (state)}
        {@const tasks = Object.values($tasksStore).filter(
          (t) => t.state === state,
        )}
        <div class="column">
          <h2>{state}</h2>
          <ul class="tasks">
            {#each tasks as task (task.id)}
              <li animate:flip={{ duration: 200 }}>
                <span class="id">
                  {task.id}
                </span>
                {#if stateIndex > 0}
                  <button
                    class="icon"
                    title={`move to ${states[stateIndex - 1]}`}
                    on:click={() =>
                      onMoveTaskClick(task, states[stateIndex - 1])}
                  >
                    arrow_back
                  </button>
                {/if}
                {#if stateIndex < states.length - 1}
                  <button
                    class="icon"
                    title={`move to ${states[stateIndex + 1]}`}
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
    grid-template-areas:
      'sidebar new-task'
      'sidebar board';
    grid-template-columns: 1fr 3fr;
    grid-template-rows: auto 1fr;
    height: 100vh;
  }

  sidebar {
    grid-area: sidebar;
    display: flex;
    flex-direction: column;
    padding: 1rem;
    background-color: var(--bg-neutral);
    color: var(--bg-neutral-content);
    gap: 1rem;
  }

  menu {
    margin: 0;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .history {
    flex: 1;
    overflow-y: auto;
  }

  ul.history-list {
    flex-direction: column-reverse;
    justify-content: flex-end;
  }

  ul.history-list li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    cursor: pointer;
  }

  ul.history-list li.isRedoStep {
    color: #aaa;
  }

  ul.history-list li.isCurrentStep {
    font-weight: bold;
    cursor: default;
  }

  .commands {
    display: flex;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .new-task {
    grid-area: new-task;
    font-size: 1.3rem;
    background-color: var(--bg-base-200);
    padding: 1rem;
  }

  .board {
    grid-area: board;
    overflow-y: auto;
  }

  .board-columns {
    display: flex;
    gap: 1rem;
    padding: 0 1rem;
    min-height: 100%;
  }

  .column {
    flex: 1;
    justify-content: stretch;
  }

  .column:not(:last-child) {
    border-right: 1px dashed var(--bg-base-300);
    padding-right: 1rem;
  }

  h2 {
    font-weight: lighter;
    font-size: 1rem;
    margin: 0;
    padding: 1rem 0;
    text-align: center;
    position: sticky;
    top: 0;
    background-color: var(--bg-base-100);
    z-index: 1;
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
    background-color: var(--bg-base-200);
    border: 1px solid var(--bg-base-300);
    border-radius: 2px;
    display: flex;
    align-items: center;
    font-size: 0.8rem;
  }

  ul.tasks span.id {
    position: absolute;
    bottom: -0.8rem;
    right: 0;
    font-size: 0.5rem;
    font-family: monospace;
    color: #aaa;
  }
</style>
