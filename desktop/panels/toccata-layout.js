// Toccata OS - Plasma 6 Desktop Layout Script
// Automatically sets up Top Global Menu Bar and Centered Floating Dock

var allPanels = panels();
for (var i = 0; i < allPanels.length; i++) {
    allPanels[i].remove();
}

// 1. Top Global Menu Bar
var topBar = new Panel();
topBar.location = "top";
topBar.height = 28;
topBar.alignment = "center";

// Add widgets to Top Bar
topBar.addWidget("org.kde.plasma.kickoff"); // Apple-style logo / launcher
topBar.addWidget("org.kde.plasma.appmenu"); // Global Menu Bar (File, Edit, View, Help)
topBar.addWidget("org.kde.plasma.panelspacer"); // Flexible spacer to push status items right
topBar.addWidget("org.kde.plasma.systemtray"); // Control Center, Wi-Fi, Volume, Battery
topBar.addWidget("org.kde.plasma.digitalclock"); // Clock

// 2. Bottom Floating Dock
var dock = new Panel();
dock.location = "bottom";
dock.height = 58;
dock.alignment = "center";
dock.hiding = "windowscover"; // Auto-hide / dodge windows
dock.floating = true; // Floating dock like macOS Big Sur/Sonoma

// Add Task Manager with magnification / launcher icons
var tasks = dock.addWidget("org.kde.plasma.icontasks");
tasks.currentConfigGroup = ["General"];
tasks.writeConfig("launchers", [
    "applications:org.kde.dolphin.desktop", // Finder equivalent
    "applications:firefox.desktop",         // Browser
    "applications:org.kde.konsole.desktop", // Terminal
    "applications:org.toccata.textedit.desktop" // Toccata TextEdit bundle
]);
dock.addWidget("org.kde.plasma.trash"); // Trash icon on dock right
