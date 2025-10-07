const express = require('express');
const mqtt = require('mqtt');
const axios = require('axios');
const app = express();
// ALTERAÇÃO IMPORTANTE ABAIXO
const PORT = process.env.PORT || 3000;

// --- CREDENCIAIS DO PAGBANK (SANDBOX) ---
const PAGBANK_TOKEN = 'c184abc3-380d-422b-80fc-03089633c7ed3c0381e94aa09440ce47ae35bd41be13fe1f-06fb-4258-9df1-7f0cba1aa505';
const PAGBANK_API_URL = 'https://sandbox.api.pagseguro.com/orders';

// ... (todo o resto do código permanece exatamente igual) ...
// ... (MQTT_HOST, MQTT_USER, etc.)

// --- INFORMAÇÕES DO BROKER MQTT (HiveMQ) ---
const MQTT_HOST = 'd848ae40758c4732b9333f823b832326.s1.eu.hivemq.cloud';
const MQTT_PORT = '8883';
const MQTT_USER = 'watervendor01';
const MQTT_PASS = 'Water2025';
const MQTT_BASE_TOPIC = 'watervendor';

// --- CONEXÃO COM O BROKER MQTT ---
const client = mqtt.connect(`mqtts://${MQTT_HOST}:${MQTT_PORT}`, {
  username: MQTT_USER,
  password: MQTT_PASS,
});

client.on('connect', () => console.log('Servidor conectado ao Broker MQTT com sucesso!'));
client.on('error', (err) => console.error('Erro de conexão com o Broker MQTT:', err));

app.use(express.json());

app.get('/', (req, res) => res.send('Servidor WaterVendor para PagBank está no ar!'));

app.post('/notification', async (req, res) => { // Mudança para o webhook do PagBank
  console.log('--- NOTIFICAÇÃO DO PAGBANK RECEBIDA ---');
  console.log('Conteúdo:', req.body);
  
  const charge = req.body.charges && req.body.charges[0];
  if (charge && charge.status === 'PAID') {
    console.log(`Pagamento APROVADO! Referência: ${charge.reference_id}`);
    const parts = charge.reference_id.split('-');
    if (parts.length === 2) {
      const machineId = parts[0];
      const volume = parseInt(parts[1], 10);
      if (volume > 0) {
        const topic = `${MQTT_BASE_TOPIC}/${machineId}/comandos`;
        const message = JSON.stringify({ msg: volume });
        client.publish(topic, message, (err) => {
          if (err) console.error(`Falha ao publicar no tópico ${topic}:`, err);
          else console.log(`>>> Comando '${message}' publicado com sucesso no tópico '${topic}'`);
        });
      }
    }
  } else {
    console.log(`Notificação recebida, mas status não era 'PAID' ou sem dados de cobrança.`);
  }
  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}.`);
});
