import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';

const app = mount(App, {
  // @ts-expect-error bootstrap element is never null
  target: document.getElementById('app'),
});

export default app;
