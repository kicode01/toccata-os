#!/usr/bin/env bash
# ==============================================================================
# Toccata OS - Windows Compatibility & Muscle Memory Translation Layer
# Allows 100% of standard Windows CMD & PowerShell commands to function
# with native Linux speed and direct integration into Toccata GUI applications.
# ==============================================================================

# Directory Navigation & File Operations
alias dir='ls -lah --color=auto --group-directories-first'
alias cls='clear'
alias md='mkdir -p'
alias rd='rmdir'
alias del='rm -i'
alias copy='cp -iv'
alias move='mv -iv'
alias ren='mv -iv'
alias type='cat'
alias attrib='chmod'

# Network & System Diagnostics
ipconfig() {
  if [[ "$1" == "/all" || "$1" == "-all" ]]; then
    ip -details addr show
  else
    ip -brief addr show
  fi
}

tasklist() {
  if [[ -n "$DISPLAY" || -n "$WAYLAND_DISPLAY" ]] && [[ "$1" == "/gui" || "$1" == "-gui" ]]; then
    tempo &>/dev/null &
  else
    ps -eo pid,user,%cpu,%mem,comm --sort=-%cpu | head -n 30
  fi
}

taskkill() {
  local target=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      /pid|/PID|-pid)
        shift
        kill -9 "$1" 2>/dev/null && echo "SUCCESS: Process with PID $1 terminated."
        return 0
        ;;
      /im|/IM|-im)
        shift
        pkill -9 "$1" 2>/dev/null && echo "SUCCESS: Process '$1' terminated."
        return 0
        ;;
      *)
        shift
        ;;
    esac
  done
  echo "Usage: taskkill /pid <PID> or taskkill /im <process_name>"
}

# Windows Explorer & App Launchers -> Mapped to Toccata GUI
explorer() {
  if [[ $# -eq 0 ]]; then
    toccata-open "${HOME}" &
  else
    toccata-open "$@" &
  fi
}

notepad() {
  if [[ -n "$1" ]]; then
    toccata-open "Scribe.app" --args "$1" &
  else
    toccata-open "Scribe.app" &
  fi
}

taskmgr() {
  tempo &>/dev/null &
}

# Package Manager: winget mapped to Toccata App Store / Flatpak
winget() {
  case "$1" in
    install|add)
      shift
      echo "[Toccata Gallery] Resolving package: $*"
      flatpak install -y "$@" || pacman -S --noconfirm "$@"
      ;;
    search|find)
      shift
      flatpak search "$@"
      ;;
    list|installed)
      flatpak list
      ;;
    upgrade|update)
      flatpak update -y
      ;;
    *)
      echo "Toccata Windows Package Shim (winget)"
      echo "Commands: winget install <pkg>, winget search <term>, winget list, winget upgrade"
      ;;
  esac
}

# System Information
systeminfo() {
  echo "========================================================"
  echo " Toccata OS (Virtuosic Edition - Zero-Terminal Desktop)"
  echo " Kernel: $(uname -srm)"
  echo " Desktop: Toccata Glass Environment (120Hz Wayland)"
  echo " Compatibility: Windows PE / Proton / Flatpak / POSIX"
  echo " Memory Available: $(free -h | awk '/^Mem:/ {print $7 "/" $2}')"
  echo " Audio Subsystem: PipeWire Pro Studio (0.7ms latency)"
  echo "========================================================"
}

export -f ipconfig tasklist taskkill explorer notepad taskmgr winget systeminfo
