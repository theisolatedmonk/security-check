const express = require('express');
const axios = require('axios');

const app = express();
const zapApiUrl = 'http://localhost:8080';

app.use(express.static('public'));
app.use(express.json());

app.post('/check-security', async(req, res) => {
    const url = req.body.url;

    try {
        // Make a request to ZAP API to initiate the security scan
        const scanResponse = await axios.get(`${zapApiUrl}/JSON/ascan/action/scan/?url=${encodeURIComponent(url)}`);
        const scanId = scanResponse.data.scan;

        // Wait for the scan to complete
        await waitForScanCompletion(scanId);

        // Retrieve the security scan results
        const resultsResponse = await axios.get(`${zapApiUrl}/JSON/ascan/view/alerts/?scanId=${scanId}`);
        const scanResults = resultsResponse.data.alerts;

        // Process the scan results and extract the relevant security information
        const securityInfo = {
            sslCertificate: scanResults.some(alert => alert.name === 'sslCertificate'),
            httpHeaders: scanResults.some(alert => alert.name === 'httpHeaders'),
            secureCookies: scanResults.some(alert => alert.name === 'secureCookies'),
            xssProtection: scanResults.some(alert => alert.name === 'xssProtection'),
            contentSecurityPolicy: scanResults.some(alert => alert.name === 'contentSecurityPolicy'),
            strictTransportSecurity: scanResults.some(alert => alert.name === 'strictTransportSecurity'),
            frameOptions: scanResults.some(alert => alert.name === 'frameOptions'),
            clickjackingProtection: scanResults.some(alert => alert.name === 'clickjackingProtection'),
            directoryListing: scanResults.some(alert => alert.name === 'directoryListing'),
            httpMethods: scanResults.some(alert => alert.name === 'httpMethods'),
        };

        res.json(securityInfo);
    } catch (error) {
        console.error('Error occurred during security check:', error);
        res.status(500).json({ error: 'An error occurred during security check' });
    }
});

async function waitForScanCompletion(scanId) {
    while (true) {
        const response = await axios.get(`${zapApiUrl}/JSON/ascan/view/status/?scanId=${scanId}`);
        const status = response.data.status;

        if (status === '100') {
            break;
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});