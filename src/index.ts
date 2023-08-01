import { prompt } from 'enquirer';
import { SerialIO } from './io';
import * as fs from 'fs/promises';
import * as path from 'path';

const dataDir = './data';
const startMaker = '--- DUMP START ---';
const endMarker = '--- DUMP END ---';

function parseResponse(response: string) {
  const lines = response.split('\n');
  const startLine = lines.findIndex((line) => line.includes(startMaker));
  const endLine = lines.findIndex((line) => line.includes(endMarker));

  // validate start and end line
  if (startLine < 0 || endLine < 0) {
    console.log('invalid response');
    return;
  }

  // parse data lines
  const dataLines = lines.slice(startLine + 2, endLine);
  const data = dataLines.map((line) => {
    // line format is 0x<address>: <value> <value> <value> ... (16x)
    const [address, valuesStr] = line.split(':');
    const values = valuesStr
      .split(' ')
      .filter((str) => str.length > 0)
      .map((str) => parseInt(str, 16));

    return {
      address: parseInt(address, 16),
      values,
    };
  });

  // ensure that data is continuous
  // address of next line must be equal to address of current line + 16
  for (let i = 0; i < data.length - 1; i++) {
    const current = data[i];
    const next = data[i + 1];
    if (current.address + 16 !== next.address) {
      console.log('data is not continuous');
      return;
    }
  }

  // convert data to buffer
  return Buffer.concat(data.map((line) => Buffer.from(line.values)));
}

async function writeFiles(label: string, response: string) {
  // build file names
  const responseFileName = path.join(dataDir, `${label}.txt`);
  const binaryFileName = path.join(dataDir, `${label}.bin`);

  // parse response to binary
  const data = parseResponse(response);
  if (!data) {
    console.log('parseResponse failed');
    return;
  }

  // ensure data dir exists
  await fs.mkdir(dataDir, { recursive: true });

  // write response and binary to file
  await fs.writeFile(responseFileName, response);
  await fs.writeFile(binaryFileName, data);
}

async function doRead(io: SerialIO) {
  // inquire read information
  const {
    label,
    startAddress: startAddressStr,
    count: countStr,
  } = (await prompt([
    {
      type: 'input',
      name: 'label',
      message: 'lable for this read',
    },
    {
      type: 'input',
      name: 'startAddress',
      message: 'Read start address',
      initial: '0',
    },
    {
      type: 'input',
      name: 'count',
      message: 'Read count',
      initial: '16',
    },
  ])) as { label: string; startAddress: string; count: string };
  const startAddress = parseInt(startAddressStr, 10);
  const count = parseInt(countStr, 10);

  const endAddress = startAddress + count;

  if (!label) {
    console.log('invalid label');
    return;
  }

  if (startAddress < 0 || endAddress <= startAddress) {
    console.log('invalid read range');
    return;
  }

  // prepare M300 read command and send it
  const m300Command = `M300 S${startAddress.toFixed(0)} E${endAddress.toFixed(0)}\n`;
  console.log(` > ${m300Command}`);
  io.serial.write(m300Command);

  // read response between start and end marker
  let response = '';
  for (;;) {
    // wait for data
    await io.waitForData();

    // read next string
    const str = io.rx.toString('utf8');

    // append to response
    response += str;

    // if response contains start marker, reset response and add only start marker
    if (response.includes(startMaker)) {
      response = response.slice(response.lastIndexOf(startMaker));
    }

    // if response contains end marker, break
    if (response.includes(endMarker)) {
      break;
    }
  }

  // write response to file
  await writeFiles(label, response);
  console.log('done');
}

async function main() {
  // start communication
  const io = new SerialIO();
  if (!(await io.open())) {
    console.log('failed to open serial port');
    return;
  }

  // read in loop
  for (;;) {
    await doRead(io);
  }
}
main().catch(console.error);
