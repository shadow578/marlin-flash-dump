# marlin-flash-dump

small (and kinda bad) utility to dump parts of flash memory from a marlin printer, specifically ones based on the HC32F460 SoC.
Hijacks the `M300` gcode to do the dumping, and comes with nearly no error handling, so good look i guess ;).


## Usage

1. copy the provided [M300.cpp](https://github.com/shadow578/marlin-flash-dump/blob/main/M300.cpp) file to your Marlin source folder, compile Marlin and flash it onto your printer.
  - to test everything works, dump a small section of memory using `M300 S0 E15` (dumps the first 16 bytes of flash)
2. connect the printer to your computer using serial (most printers have a usb port that provides serial access)
3. make sure that [node.js](https://nodejs.org) and npm are installed on your system
4. clone (or download) this repository and run `npm install`
5. run `npm start` to start the utility
6. the utility will now allow you to select the serial port the printer is connected to and the baud rate.
  - unless you changed the marlin config, the baud rate should be 115200
7. now, the utility will ask you for a few things:
  - label: the name used for the file created after reading
  - start address: address at which reading the flash starts, in hexadecimal 
  - end address: address at which reading the flash ends, in hexadecimal
8. after providing the end address, dumping will begin. This may take a few minutes.
9. after dumping is done, you'll see a "done" message and two files are created in `./data/`:
  - `./data/<label>.txt`: raw response received from the printer
  - `./data/<label>.bin`: binary containing the contents of flash in the dumped range
10. repeat steps 5-9 at least one more time with the same start and end address, and verify both binaries are equal
