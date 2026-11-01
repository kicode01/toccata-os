#!/usr/bin/env python3
"""
Toccata OS - Precision Calculator (`toccata-calc`)
Lightweight (<15ms launch), zero-bloat, Apple glass inspired calculator.
Zero telemetry, local calculation only.
"""

import sys
import tkinter as tk
from tkinter import font

class ToccataCalculator:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("Calculator")
        self.root.geometry("280x400")
        self.root.resizable(False, False)
        self.root.configure(bg="#1c1c1e")

        self.current = "0"
        self.prev = None
        self.op = None
        self.should_reset = False

        self.setup_ui()

    def setup_ui(self):
        # Screen frame
        screen_frame = tk.Frame(self.root, bg="#1c1c1e", padx=16, pady=16)
        screen_frame.pack(fill=tk.X)

        self.sub_label = tk.Label(
            screen_frame,
            text="",
            font=("Segoe UI", 10),
            bg="#1c1c1e",
            fg="#8e8e93",
            anchor="e"
        )
        self.sub_label.pack(fill=tk.X)

        self.main_label = tk.Label(
            screen_frame,
            text="0",
            font=("Segoe UI", 32, "bold"),
            bg="#1c1c1e",
            fg="#ffffff",
            anchor="e"
        )
        self.main_label.pack(fill=tk.X)

        # Keypad frame
        grid_frame = tk.Frame(self.root, bg="#1c1c1e", padx=12, pady=8)
        grid_frame.pack(fill=tk.BOTH, expand=True)

        buttons = [
            ("AC", "#3a3a3c", "#ffffff", lambda: self.btn_action("clear")),
            ("±", "#3a3a3c", "#ffffff", lambda: self.btn_action("invert")),
            ("%", "#3a3a3c", "#ffffff", lambda: self.btn_action("percent")),
            ("÷", "#ff9500", "#ffffff", lambda: self.btn_action("op", "/")),

            ("7", "#2c2c2e", "#ffffff", lambda: self.btn_action("num", "7")),
            ("8", "#2c2c2e", "#ffffff", lambda: self.btn_action("num", "8")),
            ("9", "#2c2c2e", "#ffffff", lambda: self.btn_action("num", "9")),
            ("×", "#ff9500", "#ffffff", lambda: self.btn_action("op", "*")),

            ("4", "#2c2c2e", "#ffffff", lambda: self.btn_action("num", "4")),
            ("5", "#2c2c2e", "#ffffff", lambda: self.btn_action("num", "5")),
            ("6", "#2c2c2e", "#ffffff", lambda: self.btn_action("num", "6")),
            ("−", "#ff9500", "#ffffff", lambda: self.btn_action("op", "-")),

            ("1", "#2c2c2e", "#ffffff", lambda: self.btn_action("num", "1")),
            ("2", "#2c2c2e", "#ffffff", lambda: self.btn_action("num", "2")),
            ("3", "#2c2c2e", "#ffffff", lambda: self.btn_action("num", "3")),
            ("+", "#ff9500", "#ffffff", lambda: self.btn_action("op", "+")),

            ("0", "#2c2c2e", "#ffffff", lambda: self.btn_action("num", "0"), 2),
            (".", "#2c2c2e", "#ffffff", lambda: self.btn_action("dot")),
            ("=", "#ff9500", "#ffffff", lambda: self.btn_action("equals"))
        ]

        row = 0
        col = 0
        for item in buttons:
            text = item[0]
            bg = item[1]
            fg = item[2]
            cmd = item[3]
            colspan = item[4] if len(item) > 4 else 1

            btn = tk.Button(
                grid_frame,
                text=text,
                bg=bg,
                fg=fg,
                activebackground="#48484a" if bg != "#ff9500" else "#ffb340",
                activeforeground="#ffffff",
                relief=tk.FLAT,
                font=("Segoe UI", 14),
                command=cmd
            )
            btn.grid(row=row, column=col, columnspan=colspan, sticky="nsew", padx=3, pady=3)

            col += colspan
            if col >= 4:
                col = 0
                row += 1

        for r in range(5):
            grid_frame.rowconfigure(r, weight=1)
        for c in range(4):
            grid_frame.columnconfigure(c, weight=1)

    def btn_action(self, action: str, val: str = None):
        if action == "num":
            if self.current == "0" or self.should_reset:
                self.current = val
                self.should_reset = False
            else:
                if len(self.current) < 12:
                    self.current += val
        elif action == "dot":
            if "." not in self.current:
                self.current += "."
        elif action == "clear":
            self.current = "0"
            self.prev = None
            self.op = None
            self.should_reset = False
        elif action == "invert":
            try:
                self.current = str(-float(self.current))
                if self.current.endswith(".0"):
                    self.current = self.current[:-2]
            except Exception:
                pass
        elif action == "percent":
            try:
                self.current = str(float(self.current) / 100.0)
            except Exception:
                pass
        elif action == "op":
            self.prev = float(self.current)
            self.op = val
            self.should_reset = True
        elif action == "equals":
            if self.op and self.prev is not None:
                cur = float(self.current)
                res = 0.0
                if self.op == "+":
                    res = self.prev + cur
                elif self.op == "-":
                    res = self.prev - cur
                elif self.op == "*":
                    res = self.prev * cur
                elif self.op == "/":
                    res = self.prev / cur if cur != 0 else "Error"

                self.current = str(res)
                if self.current.endswith(".0"):
                    self.current = self.current[:-2]
                self.prev = None
                self.op = None
                self.should_reset = True

        self.main_label.config(text=self.current)
        self.sub_label.config(text=f"{self.prev} {self.op}" if self.op else "")

def main():
    root = tk.Tk()
    app = ToccataCalculator(root)
    root.mainloop()

if __name__ == "__main__":
    main()
