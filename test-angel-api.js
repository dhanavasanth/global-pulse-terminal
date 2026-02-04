import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load .env manually
function loadEnv() {
    try {
        const envPath = path.join(__dirname, '.env');
        if (!fs.existsSync(envPath)) return {};

        const content = fs.readFileSync(envPath, 'utf8');
        const env = {};
        content.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["'](.*)["']$/, '$1');
                env[key] = value;
            }
        });
        return env;
    } catch (e) {
        return {};
    }
}

const env = loadEnv();
const API_KEY = env.VITE_ANGELONE_API_KEY;
const CLIENT_ID = env.VITE_ANGELONE_CLIENT_ID;
const PASSWORD = env.VITE_ANGELONE_PASSWORD;
const TOTP_SECRET = env.VITE_ANGELONE_TOTP_SECRET;

// Get TOTP from args or env
const TOTP = process.argv[2]
    ? process.argv[2]
    : (TOTP_SECRET && TOTP_SECRET.length === 6) ? TOTP_SECRET : null;

if (!TOTP) {
    console.error('❌ Error: No TOTP provided.');
    console.error('Usage: node test-angel-api.js <YOUR_6_DIGIT_TOTP>');
    console.error('Or set a valid 6-digit code in .env VITE_ANGELONE_TOTP_SECRET');
    process.exit(1);
}

const BASE_URL = 'https://apiconnect.angelbroking.com';

// Common Headers
const commonHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-UserType': 'USER',
    'X-SourceID': 'WEB',
    'X-ClientLocalIP': '127.0.0.1',
    'X-ClientPublicIP': '127.0.0.1',
    'X-MACAddress': 'MAC_ADDRESS',
    'X-PrivateKey': API_KEY
};

async function runTest() {
    console.log('🚀 Starting Angel One API Diagnostic...');
    console.log(`Checking Client ID: ${CLIENT_ID}`);

    let jwtToken = '';

    // 1. Login
    try {
        console.log('\n🔐 Attempting Login...');
        const loginRes = await fetch(`${BASE_URL}/rest/auth/angelbroking/user/v1/loginByPassword`, {
            method: 'POST',
            headers: commonHeaders,
            body: JSON.stringify({
                clientcode: CLIENT_ID,
                password: PASSWORD,
                totp: TOTP
            })
        });

        const loginData = await loginRes.json();

        if (loginData.status && loginData.data) {
            console.log('✅ Login Successful!');
            jwtToken = loginData.data.jwtToken;
        } else {
            console.error('❌ Login Failed:', loginData.message);
            console.log('Response:', JSON.stringify(loginData, null, 2));
            return;
        }
    } catch (e) {
        console.error('❌ Login Network Error:', e.message);
        return;
    }

    // 2. Test Data Fetching Modes
    const tokens = {
        'NIFTY': '99926000',
        'BANKNIFTY': '99926009'
    };

    const modes = ['LTP', 'OHLC', 'FULL'];

    console.log('\n📊 Testing Data Fetching Modes for NIFTY & BANKNIFTY...');

    for (const mode of modes) {
        console.log(`\n--- Testing Mode: ${mode} ---`);

        try {
            const res = await fetch(`${BASE_URL}/rest/secure/angelbroking/market/v1/quote`, {
                method: 'POST',
                headers: {
                    ...commonHeaders,
                    'Authorization': `Bearer ${jwtToken}`
                },
                body: JSON.stringify({
                    mode: mode,
                    exchangeTokens: {
                        NSE: Object.values(tokens)
                    }
                })
            });

            const data = await res.json();

            if (data.status && data.data) {
                console.log(`✅ ${mode} Success! Fetched: ${data.data.fetched?.length || 0} items`);

                if (data.data.fetched && data.data.fetched.length > 0) {
                    const nifty = data.data.fetched.find(item => item.symboltoken === tokens.NIFTY);

                    if (nifty) {
                        console.log('NIFTY Data Details:');
                        console.log(`- Token Key Present: ${'symboltoken' in nifty}`);
                        console.log(`- TradingSymbol: ${nifty.tradingsymbol}`);
                        console.log(`- LTP: ${nifty.ltp}`);
                        console.log(`- Close: ${nifty.close}`);
                        console.log(`- Open: ${nifty.open}`);
                        console.log(`- High: ${nifty.high}`);
                        console.log(`- Volume: ${nifty.volume} (Type: ${typeof nifty.volume})`);

                        // Full dump for inspection
                        console.log('Raw Object Keys:', Object.keys(nifty).join(', '));
                    } else {
                        console.warn('⚠️ NIFTY token not found in response list!');
                    }
                } else {
                    console.warn('⚠️ Fetched array is empty!');
                    if (data.data.unfetched && data.data.unfetched.length > 0) {
                        console.warn('Unfetched Tokens:', data.data.unfetched);
                    }
                }
            } else {
                console.error(`❌ ${mode} Failed:`, data.message);
            }

        } catch (e) {
            console.error(`❌ ${mode} Error:`, e.message);
        }
    }

    console.log('\n🏁 Diagnostic Complete.');
}

runTest();
