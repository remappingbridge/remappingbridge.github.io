# RemappingBridge — Virtual Simulator

**Explore RemappingBridge before you build it.** Try its LCD interface, joystick, mouse settings and shortcuts right in your browser — no hardware required.

**[▶ Open the interactive simulator](https://remappingbridge.github.io/)** · [RemappingBridge firmware and installation guide](https://github.com/remappingbridge/remappingbridge#readme)

## What you can try

- **Explore the LCD:** use the virtual joystick and **A/B/X/Y** buttons to navigate the menus, view Help and try Lock.
- **Customize mouse movement:** experiment with horizontal and vertical speed and pointer rotation.
- **Remap buttons:** switch between Passthrough and Custom, set a Modifier and explore **12 combinations** with **30 keyboard/media actions**.
- **Try multiple mice:** use the **Virtual Mouse Lab** to simulate pairing, reconnecting, removing and saving individual mouse profiles.
- **Inspect more screens:** explore the available LCD screens and optional diagnostic Inspector.

## Get started

1. [Open the simulator](https://remappingbridge.github.io/) and choose **Home Connected** under **Choose a demo state**.
2. In **Virtual Mouse Lab**, enter a name and select **Start Pair New → Complete Successfully**. This creates a virtual mouse profile.
3. Use the virtual joystick (or keyboard arrows and Enter) to open **Movement Options** and try the speed and rotation settings.
4. To experiment with shortcuts, visit **Remapping Options → Custom Remapping**, assign a mouse button as **Modifier**, apply the Custom profile, then open **Modifier Shortcuts**.

The joystick moves the selection and pressing it inward opens an option. **A** generally applies, **B** goes back, **X** opens Help and **Y** controls Lock. Follow the hints on each LCD screen for exceptions.

## Good to know

**This is a simulator, not a Bluetooth connection or firmware installer.** It cannot pair a real mouse, program a Pico 2 W or send keyboard/mouse actions to your computer.

Virtual mice and profiles are stored **locally in your browser** when storage is available. Removing or resetting them in the Virtual Mouse Lab affects only your simulated data. The optional Inspector works with simulated information too.

To use RemappingBridge with actual hardware, see the [components, assembly and UF2 installation instructions](https://github.com/remappingbridge/remappingbridge#hardware-and-safe-assembly) for the **Raspberry Pi Pico 2 W** and **Waveshare Pico-LCD-1.3**.

[Project source](https://github.com/remappingbridge/remappingbridge) · [Simulator source](https://github.com/remappingbridge/remappingbridge.github.io) · [Report an issue](https://github.com/remappingbridge/remappingbridge/issues) · [License](LICENSE)
