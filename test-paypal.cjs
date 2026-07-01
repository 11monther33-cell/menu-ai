import { exec } from 'child_process';
import https from 'https';

const clientId = 'Adlgy7VdHCQeCpYJprrqfh1zfpGvpWt2754dzUG-NGF0AJl0mtIDAiA0y5TCRTzXvIotBcKQ_4XalSDh';
const secret = process.env.PAYPAL_SECRET || ''; // We don't have the secret, but maybe we don't need it to just GET the plan if we use client credentials? Wait, we need secret for API calls.

// Let's just create a basic HTML file to test the button rendering directly
const fs = require('fs');
const html = `
<!DOCTYPE html>
<html>
<head>
  <title>PayPal Test</title>
  <script src="https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription"></script>
</head>
<body>
  <h1>PayPal Button Test</h1>
  <div id="paypal-button-container"></div>
  <pre id="logs"></pre>
  <script>
    function log(msg) {
      document.getElementById('logs').innerText += msg + '\\n';
      console.log(msg);
    }
    log('SDK loaded');
    try {
      paypal.Buttons({
        createSubscription: function(data, actions) {
          log('createSubscription called');
          return actions.subscription.create({
            plan_id: 'P-7VE977379D418912RNHQFDMY'
          });
        },
        onApprove: function(data, actions) {
          log('Approved');
        },
        onError: function(err) {
          log('Error: ' + err.toString());
        }
      }).render('#paypal-button-container')
      .then(() => log('Render resolved'))
      .catch(err => log('Render rejected: ' + err));
    } catch (err) {
      log('Exception: ' + err.toString());
    }
  </script>
</body>
</html>
`;
fs.writeFileSync('paypal-test.html', html);
console.log('Created paypal-test.html');
