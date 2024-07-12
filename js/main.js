// Получение ссылок на элементы UI
let connectButton = document.getElementById('connect');
let disconnectButton = document.getElementById('disconnect');
let terminalContainer = document.getElementById('terminal');
let sendForm = document.getElementById('send-form');
let inputField = document.getElementById('input');
let outputToco = document.getElementById('toco');

const example = document.getElementById("example");
//  if (example.getContext){
	const ctx = example.getContext("2d");

  example.height = document.documentElement.scrollHeight/2;//window.screen.availHeight/2;
  example.width  = document.documentElement.scrollWidth;//window.screen.availWidth;

  var grafZeroX = 20;
  var grafZeroY = example.height;
  var grafMaxX = example.width;
  var grafMaxY = 20;

  let maxToco = 60;
  let zeroToco = 800;
  let koefToco = 0.05;

/*  var gradient = ctx.createLinearGradient(0,  example.height-20, 0, 0);
  gradient.addColorStop(0.0, "springgreen");
  gradient.addColorStop(0.25, "yellow");
  gradient.addColorStop(0.75, "orange");
  gradient.addColorStop(1.0, "red");
  ctx.fillStyle = gradient;
  ctx.fillRect(20, 20, example.width, example.height - 20);*/

  ctx.strokeStyle = "#4F11B3";
  ctx.fillStyle = "#4FBBB3";
 
  ctx.beginPath();
  //рисуем вертикальные линии
let  j = grafZeroX;
let ii = 0;
 
  while(j < (grafMaxX - 20)){
    ctx.moveTo(j, grafMaxY);
    ctx.lineTo(j,  grafZeroY);
    ctx.fillText(String(ii), j, grafZeroY);
    j = j + 60; 
    ii = ii + 1;
  }

  //рисуем горизонтальные линии
  for (ii = 0; ii <= 4; ii++){
    ctx.moveTo(grafZeroX,  grafZeroY - ii*((grafZeroY - grafMaxY)/4));
    ctx.lineTo(grafMaxX,  grafZeroY - ii*((grafZeroY - grafMaxY)/4));
    ctx.fillText(String(ii*maxToco/4),0, grafZeroY - ii*((grafZeroY - grafMaxY)/4));
  }

  ctx.strokeStyle = "#EEEEEE";
  ctx.fillStyle = "#4FBBB3";
  ctx.stroke();
  //подписываем оси и график
  ctx.strokeStyle = "blue";
  ctx.fillStyle = "blue";
  ctx.font = "bold 12px sans-serif";
  ctx.fillText("мин", grafMaxX-40, grafZeroY);//',IndyTextEncoding(IdTextEncodingType.encOSDefault));
  ctx.fillText("Токо", 20, 15);//',IndyTextEncoding(IdTextEncodingType.encOSDefault));
  //AContext.Connection.IOHandler.WriteLn('ctx.fillText("Динамика ПСП", 220, 15);',IndyTextEncoding(IdTextEncodingType.encOSDefault));
  ctx.strokeStyle = "blue";
  ctx.stroke();
  ctx.strokeStyle = "#4F11B3";
  ctx.fillStyle = "#4FBBB3";
  ctx.lineWidth = 1;
  ctx.moveTo(grafZeroX, grafZeroY);

  //ctx.stroke();
//  } else {
//	log('Контекст рисования не получен!');
//  }

// Подключение к устройству при нажатии на кнопку Connect
connectButton.addEventListener('click', function() {
  connect();
});

// Отключение от устройства при нажатии на кнопку Disconnect
disconnectButton.addEventListener('click', function() {
  disconnect();
});

// Обработка события отправки формы
sendForm.addEventListener('submit', function(event) {
  event.preventDefault(); // Предотвратить отправку формы
  send(inputField.value); // Отправить содержимое текстового поля
  inputField.value = '';  // Обнулить текстовое поле
  inputField.focus();     // Вернуть фокус на текстовое поле
});

// Кэш объекта выбранного устройства
let deviceCache = null;

let bleServiceFound = null;

// Кэш объекта характеристики
let characteristicCacheRX = null;
let characteristicCacheTX = null;

// Промежуточный буфер для входящих данных
let readBuffer = '';
//массив для хранения значений токодатчика
let tocoArr = [];
//переменная для обращения к массиву
let i = 0;

// Запустить выбор Bluetooth устройства и подключиться к выбранному
function connect() {
  return (deviceCache ? Promise.resolve(deviceCache) :
      requestBluetoothDevice()).
      then(device => connectDeviceAndCacheCharacteristic(device)).
      then(characteristic => startNotifications(characteristic)).
      catch(error => log(error));
}

// Запрос выбора Bluetooth устройства
function requestBluetoothDevice() {
  log('Requesting bluetooth device...');

  return navigator.bluetooth.requestDevice({
    filters: [{services: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e']}],
  }).
      then(device => {
        log('"' +   device.name+'" bluetooth device selected');
        deviceCache = device;
        deviceCache.addEventListener('gattserverdisconnected',
            handleDisconnection);

        return deviceCache;
      });
}

// Обработчик разъединения
function handleDisconnection(event) {
  let device = event.target;

  log('"' + device.name +
      '" bluetooth device disconnected, trying to reconnect...');

  connectDeviceAndCacheCharacteristic(device).
      then(characteristic => startNotifications(characteristic)).
      catch(error => log(error));
}

// Подключение к определенному устройству, получение сервиса и характеристики
function connectDeviceAndCacheCharacteristic(device) {
  if (device.gatt.connected && characteristicCacheTX) {
    return Promise.resolve(characteristicCacheTX);
  }

  log('Connecting to GATT server...');

  return device.gatt.connect().
      then(server => {
        log('GATT server connected, getting service...');

        return server.getPrimaryService('6e400001-b5a3-f393-e0a9-e50e24dcca9e');
      }).
      then(service => {
        log('Service found, getting characteristic TX...');

        bleServiceFound = service;

        return service.getCharacteristic('6e400003-b5a3-f393-e0a9-e50e24dcca9e');
      }).
      then(characteristic => {
        log('Characteristic found');
        characteristicCacheTX = characteristic;
	send('123');
        return characteristicCacheTX;	
      });
   //send('123');
}

// Включение получения уведомлений об изменении характеристики
function startNotifications(characteristic) {
  log('Starting notifications...');

  return characteristic.startNotifications().
      then(() => {
        log('Notifications started');
        characteristic.addEventListener('characteristicvaluechanged',
            handleCharacteristicValueChanged);
      });
}

// Получение данных
function handleCharacteristicValueChanged(event) {
  let value = new TextDecoder().decode(event.target.value);

  for (let c of value) {
    if (c === '\n') {
      let data = readBuffer.trim();
      readBuffer = '';

      if (data) {
        receive(data);
      }
    }
    else {
      readBuffer += c;
    }
  }
}

// Обработка полученных данных
function receive(data) {
  //log(data, 'in');
  tocoArr[i] = parseInt(data);
  ctx.strokeStyle = "#4F11B3";
  ctx.fillStyle = "#4FBBB3";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(i + grafZeroX, grafZeroY - Math.round(grafZeroY*(tocoArr[i-1] - zeroToco)/maxToco*koefToco));
  ctx.lineTo(i + grafZeroX + 1, grafZeroY - Math.round(grafZeroY*(tocoArr[i] - zeroToco)/maxToco*koefToco));
  ctx.stroke();
  i = i+1;
  document.getElementById("toco").innerHTML = data;
  log(data, 'in');
}

// Вывод в терминал
function log(data, type = '') {
  terminalContainer.insertAdjacentHTML('beforeend',
      '<div' + (type ? ' class="' +   type+'"' : ''      )+'>'+data+'</div>');
}

// Отключиться от подключенного устройства
function disconnect() {
  if (deviceCache) {
    log('Disconnecting from "' + deviceCache.name + '" bluetooth device...');
    deviceCache.removeEventListener('gattserverdisconnected',
        handleDisconnection);

    if (deviceCache.gatt.connected) {
      deviceCache.gatt.disconnect();
      log('"' + deviceCache.  name+'" bluetooth device disconnected');
    }
    else {
      log('"' + deviceCache.name +
          '" bluetooth device is already disconnected');
    }
  }

  if (characteristicCacheTX) {
    characteristicCacheTX.removeEventListener('characteristicvaluechanged',
        handleCharacteristicValueChanged);
    characteristicCacheTX = null;
  }

/*  if (characteristicCacheRX) {
    characteristicCacheRX.removeEventListener('characteristicvaluechanged',
        handleCharacteristicValueChanged);
    characteristicCacheRX = null;
  }*/

  deviceCache = null;
}

// Отправить данные подключенному устройству
function send(data) {


  if (deviceCache && deviceCache.gatt.connected) {
    
     bleServiceFound.getCharacteristic('6e400002-b5a3-f393-e0a9-e50e24dcca9e')
    .then(characteristic => {
    	log("Found the RX characteristic: ", characteristic.uuid);
        data = String(data);
        return characteristic.writeValue(new TextEncoder().encode(data));
    })
    .then(() => {
    	latestValueSent.innerHTML = data;
    	log("Value written to RX characteristic:", data);
    })
    .catch(error => {
    	error("Error writing to the RX characteristic: ", error);
	log("Error writing to the RX characteristic: ", error);
    });
  } else {
  	error ("Bluetooth is not connected. Cannot write to characteristic.");
	log("Bluetooth is not connected. Cannot write to characteristic.");
        window.alert("Bluetooth is not connected. Cannot write to characteristic. \n Connect to BLE first!");
  }

/*  data = String(data);

  if (!data || !characteristicCacheRX) {
    return;
  }

  data += '\n';

  if (data.length > 20) {
    let chunks = data.match(/(.|[\r\n]){1,20}/g);

    writeToCharacteristic(characteristicCacheRX, chunks[0]);

    for (let i = 1; i < chunks.length; i++) {
      setTimeout(() => {
        writeToCharacteristic(characteristicCacheRX, chunks[i]);
      }, i * 100);
    }
  }
  else {
    writeToCharacteristic(characteristicCacheRX, data);
  }

  log(data, 'out'); */
}

// Записать значение в характеристику
function writeToCharacteristic(characteristic, data) {
  characteristic.writeValue(new TextEncoder().encode(data));
}
