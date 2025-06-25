// Получение ссылок на элементы UI
let connectButton = document.getElementById('connect');
let disconnectButton = document.getElementById('disconnect');
let terminalContainer = document.getElementById('terminal');
let sendForm = document.getElementById('send-form');
let inputField = document.getElementById('input');
let outputToco = document.getElementById('toco');
let zeroT = document.getElementById('zerotoco');
let batLev = document.getElementById('batlevel');
//let beginresearch = document.getElementById('begres');
let researchTimer = document.getElementById('research');
let sbrosresearch = document.getElementById('sbros');
let totalpeaks = document.getElementById('total_peaks');
let hourpeaks = document.getElementById('hour_peaks');
let websockip = document.getElementById('wsip');
let websockinputip = document.getElementById('wsinputip');
let websockconnect = document.getElementById('wsconnect');

let batteryLevelCharacteristic = null;
let batteryService = null;
let batteryLevel;

/*const socket = new WebSocket('ws://192.168.1.66:1234');
let wsconnected = false;
let wsmessage = "";

socket.onopen = () => {
      //console.log('Соединение установлено');
      log('Соединение установлено');
      wsconnected = true;
};

socket.onmessage = (event) => {
      const messagesDiv = document.getElementById('terminal');
      const newMessage = document.createElement('div');
      newMessage.textContent = `Сервер: ${event.data}`;
      messagesDiv.appendChild(newMessage);
};

socket.onclose = () => {
      //console.log('Соединение закрыто');
      //log('Соединение закрыто');
	if (event.wasClean) {
        	log('Соединение закрыто чисто');
    	} else {
        	log('Обрыв соединения'); // например, "убит" процесс сервера
    	}
    	log('Код: ' + event.code + ' причина: ' + event.reason);
        wsconnected = false;
};*/

websockconnect.addEventListener('click', () => {
	//const messageInput = document.getElementById('messageInput');
	//const ipmessage = 'ws://' + websockinputip.value + ':1234';
	//const socket = new WebSocket(ipmessage);
	const ipmessage = websockinputip.value;
	socket.send(ipmessage);

	const messagesDiv = document.getElementById('terminal');
	const newMessage = document.createElement('div');
	newMessage.textContent = `Вы: ${ipmessage}`;
	messagesDiv.appendChild(newMessage);

	websockinputip.value.value = '';
});

const example = document.getElementById("example");
//  if (example.getContext){
	const ctx = example.getContext("2d");

  example.height = document.documentElement.scrollHeight/2;//window.screen.availHeight/2;
  example.width  = document.documentElement.scrollWidth;//window.screen.availWidth;

  var grafZeroX = 20;
  var grafZeroY = example.height;
  var grafMaxX = example.width;
  var grafMaxY = 20;

  let maxToco = 240;
  let zeroToco = 0;
  let koefToco = 1;//0.05;
  let progZero = 1;//zeroT + 1;

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

//Обнуление датчика
zeroT.addEventListener('click', function() {
  let zeromessage = "$4;";
  event.preventDefault();
  send(zeromessage);
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
//переменные для поиска пиков
let tbegin = 0;
let tend = 0;
let maxAmlitude = 0;
let tmax = 0;
let tevent = false;
let eventDuration = 0;
let pikFound = false;
//частота опроса датчика 1 Гц
let freq = 1;
let tpeaks = 0;
let hpeaks = 0;
let hoursec = 0;

//let researchTimer = document.getElementById('research');
let bresearch = 0;
let resTimer;
let res_hour = 0;
let res_min = 0;
let res_sec = 0;
let time_message = "";

researchTimer.addEventListener('click', function() {  
  if (bresearch == 0) {
     bresearch = 1;
     researchTimer.innerHTML = 'Stop';
     //researchWatch();
  }
  else {
     bresearch = 0;
     researchTimer.innerHTML = 'Start';
     //researchWatch();
  }
  researchWatch();
});

sbrosresearch.addEventListener('click', function() {
   res_hour = 0;
   res_min = 0;
   res_sec = 0;
   tpeaks = 0;
   hpeaks = 0;
   totalpeaks.innerHTML = tpeaks;
   hourpeaks.innerHTML = hpeaks;
   document.getElementById('research_watch').innerHTML = '00:00:00';
});

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
    //filters: [{services: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e']}],
    filters: [{services: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e']}],
      optionalServices: ['battery_service', 'device_information']
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
async function connectDeviceAndCacheCharacteristic(device) {
  if (device.gatt.connected && characteristicCacheTX) {
    return Promise.resolve(characteristicCacheTX);
  }

  log('Connecting to GATT server...');

  const server = await device.gatt.connect();

        log('GATT server connected, getting service...');
	
	batteryService = await server.getPrimaryService('battery_service');

        let service = await server.getPrimaryService('6e400001-b5a3-f393-e0a9-e50e24dcca9e');

        log('Service found, getting characteristic Battery...');

        bleServiceFound = service;

	batteryLevelCharacteristic = await batteryService.getCharacteristic('battery_level');

	log('Service found, getting characteristic TX...');
        let characteristic = await service.getCharacteristic('6e400003-b5a3-f393-e0a9-e50e24dcca9e');

	try{
	await batteryLevelCharacteristic.startNotifications();	
	/*batteryLevelCharacteristic.addEventListener('characteristicvaluechanged', e => {
		const value = e.target.value.getUint8(0);
		log('> Bat Level is ' + value + '%');
	});*/
	//batteryLevelCharacteristic.addEventListener('characteristicvaluechanged', handleBatteryLevelChanged);
	//await batteryLevelCharacteristic.startNotifications();
	} catch(error) {
    		log('Argh! ' + error);
  	};
	//batteryLevel = await batteryLevelCharacteristic.readValue();
  	//log('> Battery Level is ' + batteryLevel.getUint8(0) + '%');
        log('Characteristic found');
        characteristicCacheTX = characteristic;
	send('123');
        return characteristicCacheTX;	

   //send('123');
}

//Включение уведомлений об изменении характеристики battery_level
function handleBatteryLevelChanged(event) {
  batteryLevel = event.target.value.getUint8(0);
  //log('>< Battery Level is ' + batteryLevel + '%');
  //batLev.innerHTML = batteryLevel.getUint8(0) + '%';
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
async function receive(data) {
  //log(data, 'in');
  tocoArr[i] = parseInt(data);

  TestPik();

  ctx.strokeStyle = "#4F11B3";
  ctx.fillStyle = "#4FBBB3";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(i + grafZeroX, grafZeroY - Math.round(grafZeroY*(tocoArr[i-1] - zeroToco + 5)/maxToco*koefToco));
  ctx.lineTo(i + grafZeroX + 1, grafZeroY - Math.round(grafZeroY*(tocoArr[i] - zeroToco + 5)/maxToco*koefToco));

  if (pikFound) {
    ctx.strokeStyle = "#4F11B3";
    ctx.fillStyle = "#4FBBB3";
    ctx.lineWidth = 1;
    ctx.moveTo(tmax + grafZeroX-5, grafZeroY - Math.round(grafZeroY*(225 - zeroToco)/maxToco*koefToco));
    ctx.lineTo(tmax + grafZeroX, grafZeroY - Math.round(grafZeroY*(220 - zeroToco)/maxToco*koefToco));
    ctx.lineTo(tmax + grafZeroX+5, grafZeroY - Math.round(grafZeroY*(225 - zeroToco)/maxToco*koefToco));
    pikFound = false;
  }

  ctx.stroke();
  i = i+1;
  //document.getElementById("toco").innerHTML = data;
  outputToco.innerHTML = data;
  log(data, 'in');

  batteryLevel = await batteryLevelCharacteristic.readValue();//читаем уровень заряда батареи
  //log('> Battery Level is ' + batteryLevel.getUint8(0) + '%');
  batLev.innerHTML = batteryLevel.getUint8(0) + '%'; //если есть эта строчка, то и уведомления об уровне заряда батареи работают

  if (wsconnected == true) {
	wsmessage = '{' + '\"Toco\"' + ':' + '\"' + data + '\"'+ '}';
	socket.send(wsmessage);
	wsmessage = '{' + '\"TotalPeaks\"' + ':' + '\"' + tpeaks + '\"'+ '}';
	socket.send(wsmessage);
	wsmessage = '{' + '\"HourPeaks\"' + ':' + '\"' + hpeaks + '\"'+ '}';
	socket.send(wsmessage);
  }
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

//поиск пиков
function TestPik() {
  if (tevent == false){
    if (tocoArr[i] > progZero) {
      tevent = true;
      tbegin = i;
      maxAmplitude = tocoArr[i];
      tmax = i;
    }
  } 
  else {
    if (tocoArr[i] > tocoArr[i-1]) {
      maxAmplitude = tocoArr[i];
      tmax = i;
    }
    if (tocoArr[i] <= progZero) {
      tend = i;
      tevent = false;
      eventDuration = (tend - tbegin)/freq;
      if ((eventDuration >=3) && (eventDuration <= 10) && (maxAmplitude >= 8) && (maxAmplitude <= 45)) {
         pikFound = true;
         tpeaks += 1;
         hpeaks += 1;
         totalpeaks.innerHTML = tpeaks;
         hourpeaks.innerHTML = hpeaks;
      }
    }
  }
} 

function researchWatch() {
  time_message = '';
  if (bresearch == 1) {
     //researchTimer.innerHTML = 'Start';
     if (res_hour < 10) {time_message = '0' + String(res_hour) + ":";}
     else {time_message = String(res_hour) + ":";}
     if (res_min < 10) {time_message += '0' + String(res_min) + ":";}
     else {time_message += String(res_min) + ":";}
     if (res_sec < 10) {time_message += '0' + String(res_sec);}
     else {time_message += String(res_sec);}
     //time_message = String.fromCharCode(res_hour) + ":" + String.fromCharCode(res_min) + ":" + String.fromCharCode(res_sec);
     //time_message = (res_hour).toString()[0] + ":" + (res_min).toString()[0] + ":" + (res_sec).toString()[0];
     //time_message = String(res_hour) + ":" + String(res_min) + ":" + String(res_sec);
     document.getElementById('research_watch').innerHTML = time_message;//'0' + String(res_sec);     
     if (res_sec < 59) 
     {
          res_sec += 1; 
          if (hoursec < 3599) {hoursec +=1;}
          else {hoursec = 0; hpeaks = 0;}
     }
     else 
     {
        res_sec = 0;
        if (res_min < 59) {res_min += 1;}
        else 
        {
           res_min = 0;
           if (res_hour < 23) {res_hour += 1;}
           else 
           {
              res_hour = 0;
           }
        }
     }
     resTimer = setTimeout(researchWatch, 1000);
  }
  else {
     clearTimeout(resTimer);
  }

}
