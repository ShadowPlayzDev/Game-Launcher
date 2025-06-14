# Game Launcher - Installation Guide

This guide will walk you through the steps to get Steve's Game Launcher up and running on your local machine using GitHub Desktop.

## Technologies Used
The Game Launcher is built using:
* **ElectronJS:** For creating a cross-platform desktop application.
* **Node.js & npm:** For the backend logic and package management.
* **Tailwind CSS:** For efficient and utility-first styling.

## Prerequisites
Before you begin, ensure you have the following installed:
* Read the [LICENCE](LICENCE)
* **Node.js & npm:** The Game Launcher requires Node.js. You can download and install it from [nodejs.org](https://nodejs.org/). npm (Node Package Manager) is included with Node.js. Chocolatey is unnecessary.
* **GitHub Desktop:** This guide assumes you are using GitHub Desktop to manage your repository. Download it from [desktop.github.com](https://desktop.github.com/).

## Installation Steps
Follow these steps to install and run the Game Launcher:

1.  **Clone the Repository using GitHub Desktop:**
    * Open **GitHub Desktop**.
    * Click on **File** > **Clone Repository...**
    * In the "URL" tab, paste the repository URL:
        ```[https://github.com/ShadowPlayzDev/Game-Launcher.git](https://github.com/ShadowPlayzDev/Game-Launcher.git)```
    * Choose a **Local Path** on your computer where you want to save the project.
    * Click the **Clone** button.

2.  **Open the Project in your File System:**
    * Once the cloning is complete in GitHub Desktop, click on **Repository** > **Show in Explorer** (Windows) or **Show in Finder** (macOS). This will open the `Game-Launcher` folder on your computer.
    * You can also delete the `README.md`, `INSTALL.md`, and `.gitattributes` files from the root folder, as they are unnecessary also.

3.  **Navigate into the Source Directory:**
    * Inside the `Game-Launcher` folder, you will find a directory named `source`. All the core files for the Game Launcher are located here.
    * Run the following command
    ```cd source```
4.  **Install Dependencies:**
    Once you are inside the `source` directory in your terminal, install all the required Node.js and ElectronJS packages:
     ```npm install```
    This command will read the `package.json` file within the `source` directory and install all necessary dependencies, including those for ElectronJS and Tailwind CSS.

5.  **Run the Game Launcher:**
    After the dependencies are installed, you can start the Game Launcher.
    ```npm start```
    *If `npm start` does not work, please check the `package.json` file in the `source` directory for alternative `scripts` (e.g., `npm run electron`, `npm run dev`).*
## Additional Commands
### Package the Application
If you would like to package the Game Launcher into a distributable application (e.g., `.exe` for Windows, `.dmg` for macOS, `.deb` for Linux), you can run the following command from within the `source` directory:
```npm run build```

## Troubleshooting
* If you encounter issues during `npm install`, ensure you have Node.js and npm correctly installed. You can try clearing your npm cache with `npm cache clean --force`.
* Verify that your terminal or command prompt is currently in the **`Game-Launcher/Source/`** directory when running `npm install` and `npm start`.

---
If you have any questions or run into further problems, please open an issue on the GitHub repository.
