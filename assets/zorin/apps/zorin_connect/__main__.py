# This file is part of the Zorin Connect program.
#
# Copyright 2019-2021 Zorin OS Technologies Ltd.
#
# This program is free software; you can redistribute it and/or modify it
# under the terms and conditions of the GNU General Public License,
# version 2, as published by the Free Software Foundation.
#
# This program is distributed in the hope it will be useful, but WITHOUT ANY
# WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
# FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
# details.

import gi
import gettext
import subprocess

gi.require_version('Gtk', '3.0')
from gi.repository import Gtk, Gio, Gdk
from zorin_connect import environment

t = gettext.translation('zorin-connect', '/usr/share/locale',
                        fallback=True)
_ = t.gettext

APP_DATA_PATH = '/usr/share/zorin-connect/'

EXTENSION = "zorin-connect@zorinos.com"
EXTENSION_ENABLED = 1
EXTENSION_DISABLED = 0

EXTENSION_APP_ID = "org.gnome.Shell.Extensions.ZorinConnect"
# Check if Zorin Connect schema is installed
if Gio.SettingsSchemaSource.get_default().lookup(EXTENSION_APP_ID, True):
    EXTENSION_SCHEMA = Gio.Settings.new(EXTENSION_APP_ID)
else:
    EXTENSION_SCHEMA = None

DEVICES_PAIRED_COMMAND = 'dconf dump /org/gnome/shell/extensions/zorin-connect/device/ | grep -q "paired=true" && printf "true" || printf "false"'

FEATURES = ["Sync your phone's notifications with your computer",
            "Browse photos from your phone",
            "Reply to SMS messages",
            "Share files and web links between devices",
            "Use your phone as a remote control for your computer"]

def title(text):
    return "<big><b>%s</b></big>" % text


class ZorinConnect(Gtk.Window):

    def __init__(self):
        Gtk.Window.__init__(self, title="Zorin Connect")
        self.set_resizable(False)

        header_bar = Gtk.HeaderBar()
        header_bar.set_show_close_button(True)
        header_bar.props.title = "Zorin Connect"
        self.set_titlebar(header_bar)

        if environment._shell.extension_is_active(EXTENSION_ENABLED, EXTENSION) and (EXTENSION_SCHEMA.get_strv("devices") == [] or boolean_command(DEVICES_PAIRED_COMMAND) == False):
            disable_button = Gtk.Button(_("Disable"))
            disable_button.connect("clicked", self.on_disable_extension)
            header_bar.pack_start(disable_button)

        next_button = Gtk.Button(_("Next"))
        next_button.connect("clicked", self.on_enable_extension)
        Gtk.StyleContext.add_class(next_button.get_style_context(), "suggested-action")
        header_bar.pack_end(next_button)
        
        box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, margin=32, spacing=18)

        image = Gtk.Image.new_from_file(APP_DATA_PATH + "/images/laptop-phone.svg")
        box.pack_start(image, False, False, 0)

        main_label = Gtk.Label(use_markup=True, label=title(_("Connect your computer with your mobile device")))
        box.pack_start(main_label, False, False, 0)

        text = ""
        for index, feature in enumerate(FEATURES, start=1):
            text += "• " + _(feature)
            if index < len(FEATURES):
              text += "\n"

        label = Gtk.Label(use_markup=True,
                          wrap=True,
                          max_width_chars=55,
                          halign=Gtk.Align.CENTER,
                          label=text)
        box.pack_start(label, False, False, 0)
        
        self.add(box)

    def on_enable_extension(self, widget):
        try:
            environment._shell.enable_extension(EXTENSION)
            spawn_process(['gapplication', 'action', EXTENSION_APP_ID, 'preferences'])
        except:
            dialog = Gtk.MessageDialog(self, 0, Gtk.MessageType.ERROR,
                Gtk.ButtonsType.OK, _("Failed to enable Zorin Connect"))
            dialog.run()
            dialog.destroy()
        Gtk.main_quit()

    def on_disable_extension(self, widget):
        environment._shell.disable_extension(EXTENSION)
        Gtk.main_quit()


def spawn_process(args=[]):
    return Gio.Subprocess.new(args, Gio.SubprocessFlags.NONE)

def boolean_command(command):
    output = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE).stdout.read().decode("utf-8")
    return output == "true"

def main():
    if environment._shell_loaded:
        if environment._shell.extension_is_active(EXTENSION_ENABLED, EXTENSION) and boolean_command(DEVICES_PAIRED_COMMAND):
            spawn_process(['gapplication', 'action', EXTENSION_APP_ID, 'preferences'])
        else:
            window = ZorinConnect()
            window.connect("destroy", Gtk.main_quit)
            window.show_all()
            Gtk.main()
    else:
        dialog = Gtk.MessageDialog(None, 0, Gtk.MessageType.ERROR,
            Gtk.ButtonsType.OK, _("Zorin Connect is not compatible with this desktop environment"))
        dialog.run()
        dialog.destroy()


if __name__ == '__main__':
    main()
