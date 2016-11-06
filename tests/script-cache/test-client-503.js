print('BEFORE HTTP 503 Service Unavailable...');
Script.include('https://httpbin.org/status/503?' + new Date().getTime().toString(36))
print('//AFTER HTTP 503 Service Unavailable.');
