<script lang="ts" context="module">
  type TodoItem = {
    id: string;
    timeCreated: number;
    timeCompleted?: number;
    text: string;
  };

  function nextId() {
    return Math.random().toString(36).substring(2, 15);
  }

  function newTodoItem(): TodoItem {
    return {
      id: nextId(),
      timeCreated: 0,
      text: '',
    };
  }
</script>

<script lang="ts">
  import '@fontsource/material-icons';
  import { undoStack, transactionCtrl } from '@gira-de/svelte-undo';
  import { writable } from 'svelte/store';
  import type { Writable } from 'svelte/store';

  // todo items

  let itemsStore: Writable<Record<string, TodoItem>> = writable({});
  $: allItems = Object.values($itemsStore).sort(
    (a, b) => a.timeCreated - b.timeCreated,
  );
  $: openItems = allItems.filter((i) => !i.timeCompleted);
  $: completedItems = allItems.filter((i) => i.timeCompleted);

  // new todo item

  let newItem = newTodoItem();

  function addDraftItem() {
    newItem.timeCreated = Date.now();
    const itemsDraft = transaction.draft(itemsStore);
    itemsDraft[newItem.id] = newItem;
    transaction.commit(`Todo item ${newItem.id} added`);
    newItem = newTodoItem();
  }

  function setItemText(item: TodoItem, text: string) {
    const itemsDraft = transaction.draft(itemsStore);
    itemsDraft[item.id].text = text;
    transaction.commit(`Todo item ${item.id} updated`);
  }

  function completeItem(item: TodoItem) {
    const itemsDraft = transaction.draft(itemsStore);
    itemsDraft[item.id].timeCompleted = Date.now();
    transaction.commit(`Todo item ${item.id} completed`);
  }

  function openItem(item: TodoItem) {
    const itemsDraft = transaction.draft(itemsStore);
    itemsDraft[item.id].timeCompleted = 0;
    transaction.commit(`Todo item ${item.id} opened`);
  }

  function removeItem(item: TodoItem) {
    const itemsDraft = transaction.draft(itemsStore);
    delete itemsDraft[item.id];
    transaction.commit(`Todo item ${item.id} removed`);
  }

  // undo stack

  const myUndoStack = undoStack('init');
  const transaction = transactionCtrl(myUndoStack);
</script>

<div class="content">
  <sidebar>
    <h1>Undo Stack</h1>
    <button on:click={myUndoStack.undo} disabled={!$myUndoStack.canUndo}
      >Undo</button
    >
    <button on:click={myUndoStack.redo} disabled={!$myUndoStack.canRedo}
      >Redo</button
    >
    <ul class="undo-stack">
      {#each $myUndoStack.actions.slice().reverse() as undoAction}
        <li
          class:redo={undoAction.seqNbr > $myUndoStack.selectedAction.seqNbr}
          class:active={undoAction.seqNbr ===
            $myUndoStack.selectedAction.seqNbr}
          on:click={() => myUndoStack.goto(undoAction.seqNbr)}
          on:keydown
        >
          {undoAction.msg}
        </li>
      {/each}
    </ul>
  </sidebar>

  <div>
    <h1>{completedItems.length} of {allItems.length} completed</h1>
    <ul class="todo-list">
      {#each openItems as item (item.id)}
        <li>
          <button class="transparent" on:click={() => completeItem(item)}>
            <span class="material-icons">check_box_outline_blank</span>
          </button>
          <input
            type="text"
            value={item.text}
            on:change={(e) => setItemText(item, e.currentTarget.value)}
          />
          <button class="transparent" on:click={() => removeItem(item)}>
            <span class="material-icons">delete</span>
          </button>
        </li>
      {/each}
      <li>
        <span />
        <input type="text" bind:value={newItem.text} />
        <button
          class="transparent"
          on:click={addDraftItem}
          disabled={!newItem.text}
        >
          <span class="material-icons">add</span>
        </button>
      </li>
      {#each completedItems as item (item.id)}
        <li>
          <button class="transparent" on:click={() => openItem(item)}>
            <span class="material-icons">check_box</span>
          </button>
          {item.text}
          <button class="transparent" on:click={() => removeItem(item)}>
            <span class="material-icons">delete</span>
          </button>
        </li>
      {/each}
    </ul>
  </div>
</div>

<style>
  div.content {
    display: grid;
    grid-template-columns: 1fr 3fr;
    gap: 3rem;
  }

  ul {
    list-style: none;
    padding: 0;
  }

  ul.undo-stack li {
    padding: 0.5rem;
    border-bottom: 1px solid #eee;
    cursor: default;
  }

  ul.undo-stack li.redo {
    opacity: 0.5;
  }

  ul.undo-stack li.active {
    background-color: #eee;
  }

  ul.todo-list {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 0.5rem;
    align-content: center;
  }

  ul.todo-list li {
    display: contents;
  }
</style>
