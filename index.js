const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

// --- CREDENCIAIS DO PAGBANK (SANDBOX) ---
const PAGBANK_TOKEN = 'c184abc3-380d-422b-80fc-03089633c7ed3c0381e94aa09440ce47ae35bd41be13fe1f-06fb-4258-9df1-7f0cba1aa505';
const PAGBANK_API_URL = 'https://sandbox.api.pagseguro.com/orders';

// URL do ngrok que você forneceu
const NGROK_URL = 'https://diagenetic-trevally-jacquiline.ngrok-free.dev';


app.use(express.json());

app.get('/', (req, res) => {
  res.send('Servidor WaterVendor para PagBank está no ar!');
});

// Rota para criar o pagamento de teste
app.get('/create-pagbank-payment', async (req, res) => {
  console.log('--- Recebida requisição para criar pagamento no PagBank ---');

  const orderData = {
    reference_id: 'maquina01-1500',
    customer: {
      name: 'Fabio Teste PagBank',
      email: 'c82705407085185618474@sandbox.pagseguro.com.br',
      tax_id: '12345678909'
    },
    items: [
      {
        name: 'Agua 1.5L Teste PagBank',
        quantity: 1,
        unit_amount: 150
      }
    ],
    qr_codes: [
      {
        amount: {
          value: 150
        }
      }
    ],
    // Enviando a URL pública correta do ngrok
    notification_urls: [`${NGROK_URL}/pagbank-notification`]
  };

  try {
    const response = await axios.post(PAGBANK_API_URL, orderData, {
      headers: {
        'Authorization': `Bearer ${PAGBANK_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('>>> Resposta do PagBank recebida com sucesso! <<<');
    const qrCodeLink = response.data.qr_codes[0].links.find(link => link.media === 'image/png').href;
    console.log('Link para a imagem do QR Code:', qrCodeLink);
    
    res.send(`<h1>QR Code PIX de Teste (PagBank) Gerado!</h1><p>Abra o link da imagem e "pague" este PIX de teste no seu painel do Sandbox do PagBank.</p><p>Link: <a href="${qrCodeLink}" target="_blank">${qrCodeLink}</a></p>`);

  } catch (error) {
    console.error('!!! ERRO ao criar pagamento no PagBank !!!', error.response ? error.response.data : error.message);
    res.status(500).send('Erro. Verifique o console.');
  }
});

// Rota para receber as notificações
app.post('/pagbank-notification', (req, res) => {
  console.log('\n--- NOTIFICAÇÃO REAL DO PAGBANK RECEBIDA ---');
  console.log('Conteúdo:', req.body);
  console.log('-------------------------------------\n');
  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}.`);
});