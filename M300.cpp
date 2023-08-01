/**
 * Marlin 3D Printer Firmware
 * Copyright (c) 2020 MarlinFirmware [https://github.com/MarlinFirmware/Marlin]
 *
 * Based on Sprinter and grbl.
 * Copyright (c) 2011 Camiel Gubbels / Erik van der Zalm
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */

#include "../../inc/MarlinConfig.h"

#if HAS_SOUND

#include "../gcode.h"

#include "../../lcd/marlinui.h" // i2c-based BUZZ
#include "../../libs/buzzer.h"  // Buzzer, if possible
#include <Arduino.h>

/**
 * M300: Play a Tone / Add a tone to the queue
 *
 *  S<frequency> - (Hz) The frequency of the tone. 0 for silence.
 *  P<duration>  - (ms) The duration of the tone.
 */
void GcodeSuite::M300()
{
    const uint32_t start = parser.ulongval('S', 0);
    const uint32_t end = parser.ulongval('E', 0xC100);

    printf("dumping from 0x%08lx to 0x%08lx\n", start, end);
    SERIAL_ECHOPGM("--- DUMP START --- \n");

    for (uint32_t i = start; i <= end; i++)
    {
        if ((i % 16) == 0)
        {
            // every 16 bytes, print the address and a new line
            printf("\n0x%08lx : ", i);
            SERIAL_FLUSH();
        }

        // print the hex value for the current byte
        printf(" %02x", pgm_read_byte(i));

        // ensure watchdog is refreshed
        MarlinHAL::watchdog_refresh();
    }
    SERIAL_EOL();
    SERIAL_ECHOPGM("--- DUMP END --- \n");
    SERIAL_FLUSH();
    delay(500);
}

#endif // HAS_SOUND
