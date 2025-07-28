
# 🛡️ Error Catcher

## Easy bug reporting and error capturing library for web apps

---

## Overview

Error Catcher is a lightweight TypeScript library for capturing errors and reporting bugs in web applications. It provides a simple UI modal for users to submit bug reports, and utilities for developers to catch and log errors efficiently.

## Installation

```bash
npm install bug-reporterjs-lib
```

## Usage in Frontend Frameworks

### Handling Report Status

You can pass a callback to `openModal(cb)` which receives a boolean `status` argument. If `status` is `true`, the report was sent successfully. If `false`, sending failed.

**Example:**

```js
reporter.openModal((status) => {
  if (status) {
    // Report sent successfully
    alert('Report sent!');
  } else {
    // Sending failed
    alert('Failed to send report.');
  }
});
```

### React

```tsx
import React from 'react';
import { BugReporter } from 'bug-reporterjs-lib';

const reporter = new BugReporter({ project: 'EFS' });

function App() {
  const handleReport = () => {
    reporter.openModal();
  };

  return (
    <button onClick={handleReport}>Report Bug</button>
  );
}

export default App;
```

### Vue 3

```vue
<script setup lang="ts">
import { BugReporter } from 'bug-reporterjs-lib';

const reporter = new BugReporter({ project: 'EFS' });

function handleReport() {
  reporter.openModal();
}
</script>

<template>
  <button @click="handleReport">Report Bug</button>
</template>
```

### Vue 2

```vue
<template>
  <button @click="handleReport">Report Bug</button>
</template>

<script>
import { BugReporter } from 'bug-reporterjs-lib';

const reporter = new BugReporter({ project: 'EFS' });

export default {
  methods: {
    handleReport() {
      reporter.openModal();
    }
  }
}
</script>
```

### Angular

```typescript

import { Component } from '@angular/core';
import { BugReporter } from 'bug-reporterjs-lib';

const reporter = new BugReporter({ project: 'EFS' });

@Component({
  selector: 'app-root',
  template: `<button (click)="handleReport()">Report Bug</button>`
})
export class AppComponent {
  handleReport() {
    reporter.openModal();
  }
}
```

## How It Works

- The library automatically listens for errors from Axios and fetch requests.
- Errors are stored in localStorage with useful metadata.
- Calling `openModal()` shows a modal with the latest error and allows users to add comments and send bug reports.

## Contributing

Pull requests and suggestions are welcome! Please open an issue to discuss your ideas.

## License

MIT
