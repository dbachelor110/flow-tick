# FlowTick for Obsidian

FlowTick is an Obsidian plugin that automatically generates and updates a progress bar based on the completion of checklist items in your notes.

It's perfect for tracking progress on long task lists, project milestones, or any document with checklists. The progress bar gives you a quick visual indicator of how much you've completed.

![FlowTick Demo](https://raw.githubusercontent.com/ice-first/obsidian-flow-tick/main/assets/demo.gif)

## Features

- **Auto-updating Progress Bar**: The progress bar automatically refreshes at a configurable interval, so it always stays up-to-date with your checklist.
- **Nested Checklist Support**: FlowTick correctly calculates progress for nested checklists. A parent task's completion is the *average* of its direct sub-tasks' completion.
- **Multiple Progress Bars**: You can have multiple `flowtick` blocks in a single note, each tracking the progress of the checklist items that follow it.
- **Dynamic Coloring**: The progress bar changes color to reflect the current completion status:
    - **Red**: Below 21%
    - **Green**: Between 21% and 99%
    - **Blue**: 100% complete!
- **Lightweight and Simple**: Just add a small code block and it works. No complex setup required.

## How to Use

1.  Create a `flowtick` code block by typing ` ```flowtick ``` ` in your note.
2.  Add checklist items (`- [ ]` or `- [x]`) below the code block.
3.  The progress bar will appear and track the completion of all checklist items between the `flowtick` block and the next `flowtick` block (or the end of the file).

### Example

Here is a simple example:

````markdown
` ``flowtick`` `

- [x] Task 1
- [ ] Task 2
  - [x] Sub-task 2.1
  - [x] Sub-task 2.2
  - [ ] Sub-task 2.3
- [ ] Task 3
````

In this example:
- `Task 1` is 100% complete.
- `Task 2` is the average of its sub-tasks, so it is (100 + 100 + 0) / 3 = 66.7% complete.
- `Task 3` is 0% complete.
- The overall progress is the average of the top-level tasks: (100 + 66.7 + 0) / 3 = **55.6%**.

## Settings

You can configure the refresh interval for the progress bars in the plugin settings tab.
- **Refresh Interval (ms)**: The time in milliseconds between each update of the progress bars. The default is `1000` (1 second).

## How to Install

### From Community Plugins (Recommended)

1.  Open **Settings** in Obsidian.
2.  Go to **Community plugins**.
3.  Make sure "Safe mode" is **off**.
4.  Click **Browse** to open the community plugins list.
5.  Search for "FlowTick".
6.  Click **Install**, and then **Enable**.

### Manual Installation

1.  Download the `main.js`, `manifest.json`, and `styles.css` files from the [latest release](https://github.com/ice-first/obsidian-flow-tick/releases).
2.  Go to your Obsidian vault's plugin folder: `VaultFolder/.obsidian/plugins/`.
3.  Create a new folder named `flow-tick`.
4.  Copy the downloaded files into the new `flow-tick` folder.
5.  Reload Obsidian.
6.  Go to **Settings** -> **Community plugins**, find "FlowTick", and enable it.

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/ice-first/obsidian-flow-tick/issues).