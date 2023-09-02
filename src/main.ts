import './app.css';
import App from './App.svelte';

const app = new App({
  // @ts-expect-error bootstrap element is never null
  target: document.getElementById('app'),
});

export default app;
