// tests/connectionScenarios.test.js
const { SerialPort } = require('serialport');
const EventEmitter = require('events');
const RFIDReader = require('../RFIDReader');
const ArduinoDevice = require('../ArduinoDevice');

jest.mock('serialport');

describe('Connection/Disconnection Scenarios', () => {
  let mockPort;
  let consoleSpy;

  beforeAll(() => {
    // Mock console to prevent logging after tests complete
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(() => {}),
      error: jest.spyOn(console, 'error').mockImplementation(() => {})
    };
  });

  beforeEach(() => {
    jest.useFakeTimers();
    mockPort = new EventEmitter();
    mockPort.isOpen = false;
    mockPort.pipe = jest.fn();
    mockPort.close = jest.fn(() => mockPort.emit('close'));
    SerialPort.mockImplementation(() => mockPort);
  });

  afterEach(() => {
    // Clean up any pending operations
    jest.clearAllTimers();
    jest.useRealTimers();
    mockPort.removeAllListeners();
    SerialPort.mockClear();
    consoleSpy.log.mockClear();
    consoleSpy.error.mockClear();
  });

  afterAll(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
  });

  test('should detect newly connected device', async () => {
    SerialPort.list.mockResolvedValueOnce([]).mockResolvedValueOnce([{
      path: '/dev/ttyUSB0',
      vendorId: '0403',
      productId: '6001',
      manufacturer: 'FTDI',
      product: 'RS232'
    }]);

    const reader = new RFIDReader({ debug: true });
    const connectSpy = jest.fn();
    reader.on('connected', connectSpy);

    // Initial connection attempt
    await reader.start();
    expect(connectSpy).not.toHaveBeenCalled();

    // Trigger retry and advance timers
    await jest.advanceTimersToNextTimerAsync();
    
    expect(connectSpy).toHaveBeenCalledWith('/dev/ttyUSB0');
  });

  test('should handle sudden disconnection', async () => {
    SerialPort.list.mockResolvedValue([{ path: '/dev/ttyUSB0' }]);
    
    const reader = new RFIDReader();
    const disconnectSpy = jest.fn();
    reader.on('disconnected', disconnectSpy);

    await reader.start();
    
    // Trigger close and flush pending operations
    mockPort.emit('close');
    await Promise.resolve();
    
    expect(disconnectSpy).toHaveBeenCalled();
    expect(mockPort.close).toHaveBeenCalled();
  });

  test('should reconnect after disconnection', async () => {
    SerialPort.list
      .mockResolvedValueOnce([{ path: '/dev/ttyUSB0' }])  // Initial connection
      .mockResolvedValueOnce([])                          // After disconnect
      .mockResolvedValueOnce([{ path: '/dev/ttyUSB1' }]); // Reconnection

    const reader = new RFIDReader();
    const connectSpy = jest.fn();
    reader.on('connected', connectSpy);

    // Initial connection
    await reader.start();
    expect(connectSpy).toHaveBeenCalledTimes(1);

    // Simulate disconnection
    mockPort.emit('close');
    await jest.advanceTimersToNextTimerAsync();
    
    // Wait for reconnection attempt
    await jest.advanceTimersToNextTimerAsync();
    
    expect(connectSpy).toHaveBeenCalledTimes(2);
    expect(connectSpy).toHaveBeenLastCalledWith('/dev/ttyUSB1');
  });

  test('should handle multiple connect/disconnect cycles', async () => {
    let portState = false;
    SerialPort.list.mockImplementation(async () => {
      return portState ? [{ path: '/dev/ttyUSB0' }] : [];
    });

    const reader = new RFIDReader({ pollInterval: 1000, maxRetry: 5000 });
    const connectSpy = jest.fn();
    const disconnectSpy = jest.fn();
    reader.on('connected', connectSpy);
    reader.on('disconnected', disconnectSpy);

    // Initial state: disconnected
    await reader.start();
    expect(connectSpy).not.toHaveBeenCalled();

    // First connection
    portState = true;
    await jest.advanceTimersToNextTimerAsync();
    expect(connectSpy).toHaveBeenCalledTimes(1);

    // Disconnect
    mockPort.emit('close');
    portState = false;
    await jest.advanceTimersToNextTimerAsync();
    expect(disconnectSpy).toHaveBeenCalledTimes(1);

    // Reconnect
    portState = true;
    await jest.advanceTimersToNextTimerAsync();
    expect(connectSpy).toHaveBeenCalledTimes(2);
  });

  test('should maintain data flow after reconnection', async () => {
    SerialPort.list
      .mockResolvedValueOnce([{ path: '/dev/ttyUSB0' }])
      .mockResolvedValueOnce([{ path: '/dev/ttyUSB1' }]);

    const reader = new RFIDReader();
    const dataSpy = jest.fn();
    reader.on('tag', dataSpy);

    // Initial connection and data
    await reader.start();
    const parser = new EventEmitter();
    mockPort.pipe.mockReturnValue(parser);
    parser.emit('data', 'TAG001');

    // Disconnect and reconnect
    mockPort.emit('close');
    await jest.advanceTimersToNextTimerAsync();
    
    // New connection and data
    const newParser = new EventEmitter();
    mockPort.pipe.mockReturnValue(newParser);
    newParser.emit('data', 'TAG002');

    expect(dataSpy).toHaveBeenNthCalledWith(1, 'TAG001');
    expect(dataSpy).toHaveBeenNthCalledWith(2, 'TAG002');
  });
});