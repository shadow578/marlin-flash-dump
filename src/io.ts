import { SerialPort } from 'serialport';
import { prompt } from 'enquirer';

export class SerialIO {
  private serialPort?: SerialPort;
  private rxBuffer = Buffer.alloc(0);

  public get serial(): SerialPort {
    if (!this.serialPort) {
      throw new Error('Serial port not open');
    }
    return this.serialPort;
  }

  public get rx(): Buffer {
    return this.rxBuffer;
  }

  /**
   * interactively open a serial port
   */
  async open(): Promise<boolean> {
    // get all available serial ports
    const availablePorts = await SerialPort.list();
    if (availablePorts.length === 0) {
      console.log('No serial port available');
      return false;
    }

    // ask user to select a serial port
    const { path, baudRate: baudRateStr } = (await prompt([
      {
        type: 'select',
        name: 'path',
        message: 'Select serial port',
        choices: availablePorts.map((port) => port.path),
      },
      {
        type: 'input',
        name: 'baudRate',
        message: 'Select baudrate',
        initial: '115200',
      },
    ])) as { path: string; baudRate: string };
    const baudRate = parseInt(baudRateStr, 10);

    if (!path || !baudRate) {
      console.log('invalid configuration selected');
      return false;
    }

    // open serial port
    this.serialPort = new SerialPort({
      path,
      baudRate,
    });

    // listen for data
    this.serialPort.on('data', (data) => {
      this.rxBuffer = Buffer.concat([this.rxBuffer, data]);
      //console.log(data.toString());
    });

    return true;
  }

  /**
   * wait until data is available in the rx buffer
   */
  async waitForData(): Promise<Buffer> {
    const rxBuffer = this.rxBuffer;
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (rxBuffer.length > 0) {
          clearInterval(interval);
          resolve(rxBuffer);
        }
      }, 100);
    });
  }
}
